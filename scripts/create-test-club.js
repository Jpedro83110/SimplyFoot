import { createClient } from '@supabase/supabase-js'
import { faker } from '@faker-js/faker'
import fs from 'fs'

// Configuration Supabase
const SUPABASE_URL = 'https://vkcojgudsrypkyxoendl.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrY29qZ3Vkc3J5cGt5eG9lbmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0ODM5OTAsImV4cCI6MjA2MzA1OTk5MH0.dkI6JyublXRtDd6DZ2LLW4i3C4tcYiOTksdcx7RxlCs'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Configuration par défaut des clubs
const CLUB_CONFIGS = {
  small: {
    name: 'Petit Club',
    teams: 3,
    players: 60,
    coaches: 3
  },
  medium: {
    name: 'Club Moyen', 
    teams: 6,
    players: 150,
    coaches: 6
  },
  large: {
    name: 'Grand Club',
    teams: 10,
    players: 250,
    coaches: 10
  },
  huge: {
    name: 'Très Grand Club',
    teams: 15,
    players: 400,
    coaches: 15
  }
}

class TestClubGenerator {
  constructor() {
    this.createdData = {
      clubs: [],
      users: [],
      teams: [],
      players: [],
      events: [],
      messages: []
    }
    
    // Configuration de faker supprimée - utilise la locale par défaut
  }

  // Génération d'un code unique
  generateCode(prefix, length = 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = prefix
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  // Génération d'une date dans le mois
  generateDateInMonth(dayOffset = 0) {
    const today = new Date()
    const date = new Date(today)
    date.setDate(today.getDate() + dayOffset)
    return date.toISOString().split('T')[0]
  }

  // Génération d'une heure aléatoire
  generateTime() {
    const hours = [9, 10, 14, 15, 16, 17, 18, 19, 20]
    const minutes = ['00', '15', '30', '45']
    const hour = hours[Math.floor(Math.random() * hours.length)]
    const minute = minutes[Math.floor(Math.random() * minutes.length)]
    return `${hour.toString().padStart(2, '0')}:${minute}`
  }

  // Création du club principal
  async createClub(config) {
    console.log(`🏟️ Création du club "${config.name}"...`)
    
    const clubData = {
      nom: `${config.name} FC`,
      adresse: faker.location.streetAddress(),
      ville: faker.location.city(),
      code_postal: faker.location.zipCode(),
      telephone: faker.phone.number(),
      email: `contact@${config.name.toLowerCase().replace(/\s+/g, '')}-fc.fr`,
      site_web: `https://www.${config.name.toLowerCase().replace(/\s+/g, '')}-fc.fr`,
      facebook_url: `https://facebook.com/${config.name.toLowerCase().replace(/\s+/g, '')}fc`,
      instagram_url: `https://instagram.com/${config.name.toLowerCase().replace(/\s+/g, '')}fc`,
      code_acces: this.generateCode('CLUB'),
      logo_url: null,
      date_creation: new Date().toISOString()
    }

    const { data: club, error } = await supabase
      .from('clubs')
      .insert(clubData)
      .select()
      .single()

    if (error) throw error
    
    this.createdData.clubs.push(club)
    console.log(`✅ Club créé avec le code: ${club.code_acces}`)
    return club
  }

  // Création des coaches/staff
  async createCoaches(clubId, count) {
    console.log(`👨‍💼 Création de ${count} coaches...`)
    const coaches = []

    for (let i = 0; i < count; i++) {
      const firstName = faker.person.firstName('male')
      const lastName = faker.person.lastName()
      const email = `coach-${firstName.toLowerCase()}.${lastName.toLowerCase()}@test.simplyfoot.com`
      
      // Création compte Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: 'TestPassword123!'
      })

      if (authError) {
        console.warn(`⚠️ Coach ${email} existe déjà, skip création auth`)
        continue
      }

      const userId = authData.user.id

      // Utilisateur
      const userData = {
        id: userId,
        email,
        nom: lastName,
        prenom: firstName,
        club_id: clubId,
        role: 'coach',
        date_creation: new Date().toISOString()
      }

      await supabase.from('utilisateurs').insert(userData)
      this.createdData.users.push(userData)

      // Staff
      const staffData = {
        utilisateur_id: userId,
        club_id: clubId,
        nom: lastName,
        prenom: firstName,
        email,
        telephone: faker.phone.number(),
        date_naissance: faker.date.between({ from: '1970-01-01', to: '1990-12-31' }).toISOString().split('T')[0],
        diplome: Math.random() > 0.3,
        niveau_diplome: Math.random() > 0.5 ? faker.helpers.arrayElement(['BEES', 'DES', 'BMF', 'CFF1', 'CFF2']) : null,
        experience: `${Math.floor(Math.random() * 15) + 1} ans`,
        statut: 'actif',
        date_embauche: new Date().toISOString()
      }

      await supabase.from('staff').insert(staffData)
      coaches.push({ userId, ...staffData })
    }

    console.log(`✅ ${coaches.length} coaches créés`)
    return coaches
  }

  // Création des équipes
  async createTeams(clubId, coaches, teamCount) {
    console.log(`⚽ Création de ${teamCount} équipes...`)
    const teams = []
    const categories = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'U20', 'Séniors A', 'Séniors B', 'Vétérans', 'Féminines', 'U15 Féminin']

    for (let i = 0; i < teamCount; i++) {
      const coach = coaches[i % coaches.length]
      const category = categories[i % categories.length]
      
      const teamData = {
        nom: `${category} - Équipe ${i + 1}`,
        categorie: category,
        description: `Équipe ${category} du club`,
        coach_id: coach.userId,
        club_id: clubId,
        code_equipe: this.generateCode('EQ')
      }

      const { data: team, error } = await supabase
        .from('equipes')
        .insert(teamData)
        .select()
        .single()

      if (error) throw error
      
      teams.push(team)
      this.createdData.teams.push(team)
    }

    console.log(`✅ ${teams.length} équipes créées`)
    return teams
  }

  // Création des joueurs
  async createPlayers(clubId, teams, totalPlayers) {
    console.log(`👥 Création de ${totalPlayers} joueurs...`)
    const players = []
    const playersPerTeam = Math.floor(totalPlayers / teams.length)

    for (let teamIndex = 0; teamIndex < teams.length; teamIndex++) {
      const team = teams[teamIndex]
      const playerCount = teamIndex === teams.length - 1 
        ? totalPlayers - (players.length) // Dernière équipe récupère le reste
        : playersPerTeam

      for (let i = 0; i < playerCount; i++) {
        const isMinor = Math.random() > 0.3 // 70% de mineurs
        const firstName = faker.person.firstName()
        const lastName = faker.person.lastName()
        const email = `joueur-${firstName.toLowerCase()}.${lastName.toLowerCase()}@test.simplyfoot.com`
        
        // Création compte Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password: 'TestPassword123!'
        })

        if (authError) {
          console.warn(`⚠️ Joueur ${email} existe déjà, skip`)
          continue
        }

        const userId = authData.user.id

        // Utilisateur
        const userData = {
          id: userId,
          email,
          nom: lastName,
          prenom: firstName,
          club_id: clubId,
          role: 'joueur',
          date_creation: new Date().toISOString()
        }

        await supabase.from('utilisateurs').insert(userData)
        this.createdData.users.push(userData)

        // Joueur
        const birthDate = isMinor 
          ? faker.date.between({ from: '2006-01-01', to: '2012-12-31' })
          : faker.date.between({ from: '1990-01-01', to: '2005-12-31' })

        const playerData = {
          equipe_id: team.id,
          nom: lastName,
          prenom: firstName,
          date_naissance: birthDate.toISOString().split('T')[0],
          poste: faker.helpers.arrayElement(['Gardien', 'Défenseur', 'Milieu', 'Attaquant']),
          numero_licence: `LIC${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`,
          visite_medicale_valide: Math.random() > 0.1,
          telephone: isMinor ? null : faker.phone.number()
        }

        const { data: player, error: playerError } = await supabase
          .from('joueurs')
          .insert(playerData)
          .select()
          .single()

        if (playerError) throw playerError

        // Lier utilisateur au joueur
        await supabase
          .from('utilisateurs')
          .update({ joueur_id: player.id })
          .eq('id', userId)

        // Décharge parentale si mineur
        if (isMinor) {
          const dechargeData = {
            joueur_id: player.id,
            parent_nom: faker.person.lastName(),
            parent_prenom: faker.person.firstName(),
            parent_telephone: faker.phone.number(),
            accepte_transport: Math.random() > 0.2,
            date_signature: new Date().toISOString()
          }

          await supabase.from('decharges_generales').insert(dechargeData)
        }

        players.push({ userId, playerId: player.id, teamId: team.id, ...playerData })
      }
    }

    console.log(`✅ ${players.length} joueurs créés`)
    return players
  }

  // Création des événements (matchs, entraînements)
  async createEvents(teams, coaches) {
    console.log(`📅 Création d'événements pour le mois...`)
    const events = []

    for (const team of teams) {
      const coach = coaches.find(c => c.userId === team.coach_id)
      
      // 2 entraînements par semaine pour 4 semaines
      for (let week = 0; week < 4; week++) {
        for (let training = 0; training < 2; training++) {
          const dayOffset = (week * 7) + (training * 3) + Math.floor(Math.random() * 2)
          
          const eventData = {
            titre: `Entraînement ${team.nom}`,
            description: 'Entraînement hebdomadaire',
            date: this.generateDateInMonth(dayOffset),
            heure: this.generateTime(),
            lieu: faker.helpers.arrayElement(['Terrain A', 'Terrain B', 'Gymnase', 'Stade Municipal']),
            lieu_complement: faker.location.streetAddress(),
            type: 'entrainement',
            coach_id: coach.userId,
            equipe_id: team.id,
            meteo: faker.helpers.arrayElement(['Ensoleillé', 'Nuageux', 'Pluvieux', null]),
            latitude: faker.location.latitude(),
            longitude: faker.location.longitude()
          }

          const { data: event, error } = await supabase
            .from('evenements')
            .insert(eventData)
            .select()
            .single()

          if (error) throw error
          events.push(event)
        }

        // 1 match par semaine
        const matchDay = (week * 7) + 6 + Math.floor(Math.random() * 1)
        const isHome = Math.random() > 0.5
        const adversaire = `${faker.company.name()} FC`

        const matchData = {
          titre: isHome ? `${team.nom} vs ${adversaire}` : `${adversaire} vs ${team.nom}`,
          description: `Match de championnat contre ${adversaire}`,
          date: this.generateDateInMonth(matchDay),
          heure: faker.helpers.arrayElement(['14:30', '15:00', '16:00', '17:00']),
          lieu: isHome ? 'Stade Municipal' : `Stade de ${faker.location.city()}`,
          lieu_complement: faker.location.streetAddress(),
          type: 'match',
          coach_id: coach.userId,
          equipe_id: team.id,
          meteo: faker.helpers.arrayElement(['Ensoleillé', 'Nuageux', 'Pluvieux', null]),
          latitude: faker.location.latitude(),
          longitude: faker.location.longitude()
        }

        const { data: match, error: matchError } = await supabase
          .from('evenements')
          .insert(matchData)
          .select()
          .single()

        if (matchError) throw matchError
        events.push(match)
      }
    }

    this.createdData.events = events
    console.log(`✅ ${events.length} événements créés`)
    return events
  }

  // Création des participations aux événements
  async createParticipations(events, players) {
    console.log(`✅ Création des participations aux événements...`)
    
    for (const event of events) {
      const teamPlayers = players.filter(p => p.teamId === event.equipe_id)
      
      for (const player of teamPlayers) {
        // 85% de chances de répondre à la convocation
        if (Math.random() > 0.15) {
          const participationData = {
            joueur_id: player.playerId,
            evenement_id: event.id,
            reponse: faker.helpers.arrayElement(['present', 'absent', 'incertain']),
            besoin_transport: Math.random() > 0.7,
            commentaire: Math.random() > 0.8 ? faker.lorem.sentence() : null,
            date_reponse: new Date().toISOString()
          }

          await supabase.from('participations_evenement').insert(participationData)
        }
      }
    }

    console.log(`✅ Participations créées`)
  }

  // Création de compositions pour les matchs
  async createCompositions(events, players) {
    console.log(`⚽ Création des compositions...`)
    
    const matches = events.filter(e => e.type === 'match')
    
    for (const match of matches) {
      const teamPlayers = players.filter(p => p.teamId === match.equipe_id)
      
      // Créer une composition seulement s'il y a des joueurs
      if (teamPlayers.length > 0) {
        const selectedPlayers = faker.helpers.arrayElements(teamPlayers, Math.min(11, teamPlayers.length))
        
        const composition = {}
        selectedPlayers.forEach((player, index) => {
          composition[player.playerId] = faker.helpers.arrayElement(['Gardien', 'Défenseur', 'Milieu', 'Attaquant'])
        })

        const compositionData = {
          evenement_id: match.id,
          joueurs: JSON.stringify(composition),
          validee: true,
          date_validation: new Date().toISOString()
        }

        await supabase.from('compositions').insert(compositionData)
      }
    }

    console.log(`✅ Compositions créées pour ${matches.length} matchs`)
  }

  // Création de messages et communications
  async createMessages(teams, players, coaches) {
    console.log(`💬 Création des messages...`)
    
    for (const team of teams) {
      const teamPlayers = players.filter(p => p.teamId === team.id)
      const coach = coaches.find(c => c.userId === team.coach_id)
      
      if (!coach) continue
      
      // Messages de groupe (coach vers équipe)
      for (let i = 0; i < 5; i++) {
        const messageData = {
          contenu: faker.lorem.sentences(2),
          expediteur_id: coach.userId,
          equipe_id: team.id,
          auteur: 'coach',
          created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        }

        await supabase.from('messages_groupe_coach').insert(messageData)
      }

      // Messages privés (quelques échanges coach-joueur) - seulement s'il y a des joueurs
      if (teamPlayers.length > 0) {
        const somePlayer = faker.helpers.arrayElement(teamPlayers)
        for (let i = 0; i < 3; i++) {
          const isFromCoach = Math.random() > 0.5
          
          const privateMessageData = {
            emetteur_id: isFromCoach ? coach.userId : somePlayer.userId,
            recepteur_id: isFromCoach ? somePlayer.userId : coach.userId,
            auteur: isFromCoach ? 'coach' : 'joueur',
            texte: faker.lorem.sentence(),
            created_at: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString()
          }

          await supabase.from('messages_prives').insert(privateMessageData)
        }
      }
    }

    console.log(`✅ Messages créés`)
  }

  // Création d'évaluations
  async createEvaluations(players, coaches, teams) {
    console.log(`📊 Création des évaluations...`)
    
    for (const player of players) {
      // Trouver le bon coach pour ce joueur
      const team = teams.find(t => t.id === player.teamId)
      const coach = coaches.find(c => c.userId === team?.coach_id)
      
      if (!coach) continue

      // Évaluation mentale (70% des joueurs)
      if (Math.random() > 0.3) {
        const mentalEvalData = {
          joueur_id: player.playerId,
          coach_id: coach.userId,
          motivation: Math.floor(Math.random() * 5) + 1,
          concentration: Math.floor(Math.random() * 5) + 1,
          gestion_stress: Math.floor(Math.random() * 5) + 1,
          esprit_equipe: Math.floor(Math.random() * 5) + 1,
          leadership: Math.floor(Math.random() * 5) + 1,
          commentaire: faker.lorem.sentence(),
          date_evaluation: this.generateDateInMonth(-Math.floor(Math.random() * 15))
        }

        await supabase.from('evaluations_mentales').insert(mentalEvalData)
      }

      // Évaluation technique (60% des joueurs)
      if (Math.random() > 0.4) {
        const techEvalData = {
          joueur_id: player.playerId,
          coach_id: coach.userId,
          technique_balle: Math.floor(Math.random() * 5) + 1,
          vitesse: Math.floor(Math.random() * 5) + 1,
          endurance: Math.floor(Math.random() * 5) + 1,
          force: Math.floor(Math.random() * 5) + 1,
          agilite: Math.floor(Math.random() * 5) + 1,
          precision_tir: Math.floor(Math.random() * 5) + 1,
          jeu_tete: Math.floor(Math.random() * 5) + 1,
          commentaire: faker.lorem.sentence(),
          date_evaluation: this.generateDateInMonth(-Math.floor(Math.random() * 15))
        }

        await supabase.from('evaluations_techniques').insert(techEvalData)
      }
    }

    console.log(`✅ Évaluations créées`)
  }

  // Génération du club complet
  async generateClub(size = 'medium') {
    try {
      const config = CLUB_CONFIGS[size]
      if (!config) {
        throw new Error(`Taille de club invalide: ${size}. Utilisez: ${Object.keys(CLUB_CONFIGS).join(', ')}`)
      }

      console.log(`🚀 Génération d'un club de taille "${size}"`)
      console.log(`📊 Configuration: ${config.teams} équipes, ${config.players} joueurs, ${config.coaches} coaches`)
      console.log('═'.repeat(60))

      // 1. Création du club
      const club = await this.createClub(config)

      // 2. Création des coaches
      const coaches = await this.createCoaches(club.id, config.coaches)

      // 3. Création des équipes  
      const teams = await this.createTeams(club.id, coaches, config.teams)

      // 4. Création des joueurs
      const players = await this.createPlayers(club.id, teams, config.players)

      // 5. Création des événements
      const events = await this.createEvents(teams, coaches)

      // 6. Création des participations
      await this.createParticipations(events, players)

      // 7. Création des compositions
      await this.createCompositions(events, players)

      // 8. Création des messages
      await this.createMessages(teams, players, coaches)

      // 9. Création des évaluations
      await this.createEvaluations(players, coaches, teams)

      // Sauvegarde des informations
      const summary = {
        club: {
          id: club.id,
          nom: club.nom,
          code_acces: club.code_acces
        },
        stats: {
          coaches: coaches.length,
          teams: teams.length,
          players: players.length,
          events: events.length
        },
        createdData: this.createdData
      }

      const fileName = `test-club-${size}-${Date.now()}.json`
      fs.writeFileSync(`scripts/reports/${fileName}`, JSON.stringify(summary, null, 2))

      console.log('\n🎉 CLUB DE TEST CRÉÉ AVEC SUCCÈS !')
      console.log('═'.repeat(60))
      console.log(`🏟️ Nom du club: ${club.nom}`)
      console.log(`🔑 Code d'accès: ${club.code_acces}`)
      console.log(`👨‍💼 Coaches: ${coaches.length}`)
      console.log(`⚽ Équipes: ${teams.length}`)
      console.log(`👥 Joueurs: ${players.length}`)
      console.log(`📅 Événements: ${events.length}`)
      console.log(`💾 Rapport sauvegardé: ${fileName}`)
      
      console.log('\n🔐 COMPTES DE TEST CRÉÉS:')
      console.log('Coaches:')
      coaches.forEach((coach, i) => {
        console.log(`  ${i + 1}. ${coach.email} / TestPassword123!`)
      })
      
      return summary

    } catch (error) {
      console.error('❌ Erreur lors de la génération:', error)
      throw error
    }
  }

  // Nouvelle méthode pour lister tous les clubs de test
  async listTestClubs() {
    console.log('📋 Liste des clubs de test existants...')
    
    try {
      const { data: clubs, error } = await supabase
        .from('clubs')
        .select('id, nom, code_acces, date_creation')
        .ilike('nom', '%FC')
        .order('date_creation', { ascending: false })

      if (error) throw error

      if (!clubs || clubs.length === 0) {
        console.log('❌ Aucun club de test trouvé')
        return []
      }

      console.log('\n📊 CLUBS DE TEST DISPONIBLES:')
      console.log('═'.repeat(80))
      clubs.forEach((club, index) => {
        const dateCreation = new Date(club.date_creation).toLocaleDateString('fr-FR')
        console.log(`${index + 1}. ID: ${club.id} | ${club.nom} | Code: ${club.code_acces} | Créé: ${dateCreation}`)
      })
      console.log('═'.repeat(80))
      console.log(`Total: ${clubs.length} club(s) de test`)

      return clubs
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des clubs:', error)
      return []
    }
  }

  // Méthode pour obtenir des statistiques détaillées d'un club
  async getClubStats(clubId) {
    try {
      const { data: club } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', clubId)
        .single()

      if (!club) {
        console.log(`❌ Club ID ${clubId} non trouvé`)
        return null
      }

      // Compter les éléments liés
      const [
        { count: coachCount },
        { count: teamCount },
        { count: playerCount },
        { count: eventCount }
      ] = await Promise.all([
        supabase.from('staff').select('*', { count: 'exact', head: true }).eq('club_id', clubId),
        supabase.from('equipes').select('*', { count: 'exact', head: true }).eq('club_id', clubId),
        supabase.from('utilisateurs').select('*', { count: 'exact', head: true }).eq('club_id', clubId).eq('role', 'joueur'),
        supabase.from('evenements').select('*', { count: 'exact', head: true }).eq('coach_id', clubId)
      ])

      const stats = {
        club,
        coaches: coachCount || 0,
        teams: teamCount || 0,
        players: playerCount || 0,
        events: eventCount || 0
      }

      console.log(`\n📊 STATISTIQUES DU CLUB: ${club.nom}`)
      console.log('═'.repeat(50))
      console.log(`🏟️ Nom: ${club.nom}`)
      console.log(`🔑 Code d'accès: ${club.code_acces}`)
      console.log(`📅 Créé le: ${new Date(club.date_creation).toLocaleDateString('fr-FR')}`)
      console.log(`👨‍💼 Coaches: ${stats.coaches}`)
      console.log(`⚽ Équipes: ${stats.teams}`)
      console.log(`👥 Joueurs: ${stats.players}`)
      console.log(`📅 Événements: ${stats.events}`)

      return stats
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des stats:', error)
      return null
    }
  }

  // Méthode améliorée de suppression avec confirmation
  async deleteClub(clubId) {
    console.log(`🔍 Recherche du club ID: ${clubId}...`)
    
    try {
      // Vérifier que le club existe et récupérer ses stats
      const stats = await this.getClubStats(clubId)
      if (!stats) return

      // Demander confirmation (simulation en affichant ce qui sera supprimé)
      console.log('\n⚠️ ATTENTION: Cette action va supprimer définitivement:')
      console.log(`   - Le club "${stats.club.nom}"`)
      console.log(`   - ${stats.coaches} coach(s) et leurs comptes`)
      console.log(`   - ${stats.teams} équipe(s)`)
      console.log(`   - ${stats.players} joueur(s) et leurs comptes`)
      console.log(`   - ${stats.events} événement(s)`)
      console.log(`   - Tous les messages, évaluations et participations associés`)
      
      console.log('\n🗑️ Début de la suppression...')

      // Suppression en cascade avec ordre important pour éviter les erreurs de contraintes
      const deletions = [
        { table: 'participations_evenement', condition: 'evenement_id', name: 'participations' },
        { table: 'compositions', condition: 'evenement_id', name: 'compositions' },
        { table: 'evaluations_mentales', condition: 'coach_id', name: 'évaluations mentales' },
        { table: 'evaluations_techniques', condition: 'coach_id', name: 'évaluations techniques' },
        { table: 'messages_prives', condition: 'emetteur_id', name: 'messages privés (expéditeur)' },
        { table: 'messages_prives', condition: 'recepteur_id', name: 'messages privés (récepteur)' },
        { table: 'messages_groupe_coach', condition: 'expediteur_id', name: 'messages groupe' },
        { table: 'decharges_generales', condition: 'joueur_id', name: 'décharges parentales' },
        { table: 'suivis_personnalises', condition: 'coach_id', name: 'suivis personnalisés' },
        { table: 'evenements', condition: 'coach_id', name: 'événements' },
        { table: 'joueurs', condition: 'equipe_id', name: 'joueurs' },
        { table: 'equipes', condition: 'club_id', name: 'équipes' },
        { table: 'staff', condition: 'club_id', name: 'staff' },
        { table: 'utilisateurs', condition: 'club_id', name: 'utilisateurs' },
        { table: 'clubs', condition: 'id', name: 'club' }
      ]

      // Exécuter les suppressions avec feedback
      for (const deletion of deletions) {
        try {
          let query = supabase.from(deletion.table).delete()
          
          // Gestion spéciale pour certaines tables qui nécessitent des conditions différentes
          if (deletion.table === 'participations_evenement' || deletion.table === 'compositions') {
            // D'abord récupérer les IDs des événements du club
            const { data: events } = await supabase
              .from('evenements')
              .select('id')
              .eq('coach_id', clubId)
            
            if (events && events.length > 0) {
              const eventIds = events.map(e => e.id)
              await query.in('evenement_id', eventIds)
            }
          } else if (deletion.table === 'decharges_generales') {
            // Récupérer les IDs des joueurs du club
            const { data: teams } = await supabase
              .from('equipes')
              .select('id')
              .eq('club_id', clubId)
            
            if (teams && teams.length > 0) {
              const teamIds = teams.map(t => t.id)
              const { data: players } = await supabase
                .from('joueurs')
                .select('id')
                .in('equipe_id', teamIds)
              
              if (players && players.length > 0) {
                const playerIds = players.map(p => p.id)
                await query.in('joueur_id', playerIds)
              }
            }
          } else if (deletion.table === 'joueurs') {
            // Récupérer les IDs des équipes du club
            const { data: teams } = await supabase
              .from('equipes')
              .select('id')
              .eq('club_id', clubId)
            
            if (teams && teams.length > 0) {
              const teamIds = teams.map(t => t.id)
              await query.in('equipe_id', teamIds)
            }
          } else if (deletion.table === 'evaluations_mentales' || deletion.table === 'evaluations_techniques') {
            // Récupérer les IDs des coaches du club
            const { data: coaches } = await supabase
              .from('staff')
              .select('utilisateur_id')
              .eq('club_id', clubId)
            
            if (coaches && coaches.length > 0) {
              const coachIds = coaches.map(c => c.utilisateur_id)
              await query.in('coach_id', coachIds)
            }
          } else if (deletion.table === 'messages_prives') {
            // Gérer les messages privés (expéditeur et récepteur)
            const { data: users } = await supabase
              .from('utilisateurs')
              .select('id')
              .eq('club_id', clubId)
            
            if (users && users.length > 0) {
              const userIds = users.map(u => u.id)
              if (deletion.condition === 'emetteur_id') {
                await query.in('emetteur_id', userIds)
              } else {
                await query.in('recepteur_id', userIds)
              }
            }
          } else if (deletion.table === 'messages_groupe_coach') {
            // Récupérer les IDs des équipes du club
            const { data: teams } = await supabase
              .from('equipes')
              .select('id')
              .eq('club_id', clubId)
            
            if (teams && teams.length > 0) {
              const teamIds = teams.map(t => t.id)
              await query.in('equipe_id', teamIds)
            }
          } else if (deletion.table === 'suivis_personnalises') {
            // Récupérer les IDs des coaches du club
            const { data: coaches } = await supabase
              .from('staff')
              .select('utilisateur_id')
              .eq('club_id', clubId)
            
            if (coaches && coaches.length > 0) {
              const coachIds = coaches.map(c => c.utilisateur_id)
              await query.in('coach_id', coachIds)
            }
          } else {
            await query.eq(deletion.condition, clubId)
          }
          
          console.log(`  ✅ ${deletion.name} supprimés`)
        } catch (err) {
          console.warn(`  ⚠️ Erreur suppression ${deletion.name}:`, err.message)
        }
      }
      
      console.log('\n✅ Club supprimé avec succès!')
      console.log(`🗑️ "${stats.club.nom}" et toutes ses données ont été supprimés de la base`)
      
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error)
      throw error
    }
  }

  // Suppression de tous les clubs de test (avec confirmation)
  async deleteAllTestClubs() {
    console.log('🚨 SUPPRESSION DE TOUS LES CLUBS DE TEST')
    
    const clubs = await this.listTestClubs()
    if (clubs.length === 0) return

    console.log(`\n⚠️ ATTENTION: Vous allez supprimer ${clubs.length} club(s) de test!`)
    console.log('Cette action est irréversible.')
    
    for (const club of clubs) {
      console.log(`\n🗑️ Suppression de "${club.nom}"...`)
      await this.deleteClub(club.id)
    }
    
    console.log('\n🎉 Tous les clubs de test ont été supprimés!')
  }
}

// Fonction principale mise à jour
async function main() {
  const action = process.argv[2]
  const param = process.argv[3]

  const generator = new TestClubGenerator()

  switch (action) {
    case 'create':
      const size = param || 'medium'
      await generator.generateClub(size)
      break
      
    case 'list':
      await generator.listTestClubs()
      break
      
    case 'stats':
      if (!param) {
        console.error('❌ ID du club requis pour les statistiques')
        console.log('Usage: node create-test-club.js stats [CLUB_ID]')
        process.exit(1)
      }
      await generator.getClubStats(param)
      break
      
    case 'delete':
      if (!param) {
        console.error('❌ ID du club requis pour la suppression')
        console.log('Usage: node create-test-club.js delete [CLUB_ID]')
        process.exit(1)
      }
      await generator.deleteClub(param)
      break
      
    case 'delete-all':
      await generator.deleteAllTestClubs()
      break
      
    default:
      console.log('🏟️ Générateur de clubs de test SimplyFoot')
      console.log('\nUsage:')
      console.log('  Créer un club:     node create-test-club.js create [small|medium|large|huge]')
      console.log('  Lister les clubs:  node create-test-club.js list')
      console.log('  Stats d\'un club:   node create-test-club.js stats [CLUB_ID]')
      console.log('  Supprimer un club: node create-test-club.js delete [CLUB_ID]')
      console.log('  Supprimer tous:    node create-test-club.js delete-all')
      console.log('\nTailles disponibles:')
      Object.entries(CLUB_CONFIGS).forEach(([key, config]) => {
        console.log(`  ${key}: ${config.teams} équipes, ${config.players} joueurs`)
      })
      break
  }
}

// Exécution si appelé directement - Correction pour Windows
const isMainModule = () => {
  const currentUrl = import.meta.url
  const mainUrl = `file:///${process.argv[1].replace(/\\/g, '/')}`
  return currentUrl === mainUrl
}

if (isMainModule()) {
  main().catch(console.error)
}

export { TestClubGenerator }
