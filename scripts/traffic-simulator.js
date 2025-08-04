import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuration Supabase - URLs réelles du projet
const SUPABASE_URL = 'https://vkcojgudsrypkyxoendl.supabase.co';
const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrY29qZ3Vkc3J5cGt5eG9lbmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0ODM5OTAsImV4cCI6MjA2MzA1OTk5MH0.dkI6JyublXRtDd6DZ2LLW4i3C4tcYiOTksdcx7RxlCs';

class TrafficSimulator {
    constructor(config = {}) {
        this.config = {
            users: config.users || 10,
            duration: config.duration || 60000, // 1 minute par défaut
            rampUpTime: config.rampUpTime || 10000, // 10 secondes pour démarrer tous les users
            scenarios: config.scenarios || ['joueur', 'coach'],
            verbose: config.verbose || false,
            ...config,
        };

        this.clients = [];
        this.metrics = {
            requests: 0,
            errors: 0,
            responseTimes: [],
            errorsByType: {},
            requestsByEndpoint: {},
        };

        this.isRunning = false;
        this.startTime = null;
    }

    // Création de clients Supabase pour chaque utilisateur simulé
    async createClients() {
        console.log(`🚀 Création de ${this.config.users} clients utilisateurs...`);

        for (let i = 0; i < this.config.users; i++) {
            const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            const userType = this.config.scenarios[i % this.config.scenarios.length];

            this.clients.push({
                id: i + 1,
                client,
                userType,
                authenticated: false,
                lastAction: null,
            });
        }
    }

    // Authentification des utilisateurs simulés
    async authenticateUsers() {
        console.log('🔐 Authentification des utilisateurs simulés...');

        const authPromises = this.clients.map(async (userClient, index) => {
            try {
                // Utilisation de comptes de test existants ou création automatique
                const email = `test-${userClient.userType}-${userClient.id}@simplyfoot.test`;
                const password = 'TestPassword123!';

                const { data, error } = await userClient.client.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error && error.message.includes('Invalid login credentials')) {
                    // Si l'utilisateur n'existe pas, on le simule sans créer de compte réel
                    console.log(`⚠️  Utilisateur ${email} non trouvé, simulation sans auth réelle`);
                    userClient.authenticated = true;
                    return;
                }

                if (error) {
                    throw error;
                }

                userClient.authenticated = true;
                this.log(`✅ Utilisateur ${userClient.id} (${userClient.userType}) authentifié`);
            } catch (error) {
                this.logError(`❌ Erreur auth utilisateur ${userClient.id}:`, error.message);
                // Continue la simulation même sans auth réelle
                userClient.authenticated = true;
            }
        });

        await Promise.all(authPromises);
    }

    // Scénarios de simulation pour un joueur
    async simulateJoueurScenario(userClient) {
        const actions = [
            () => this.simulateGetDashboard(userClient),
            () => this.simulateGetConvocations(userClient),
            () => this.simulateGetMessages(userClient),
            () => this.simulateGetEquipe(userClient),
            () => this.simulateGetEvaluations(userClient),
            () => this.simulateUpdateParticipation(userClient),
        ];

        // Exécute une action aléatoire
        const action = actions[Math.floor(Math.random() * actions.length)];
        await action();
    }

    // Scénarios de simulation pour un coach
    async simulateCoachScenario(userClient) {
        const actions = [
            () => this.simulateGetDashboardCoach(userClient),
            () => this.simulateGetEquipes(userClient),
            () => this.simulateGetEvenements(userClient),
            () => this.simulateGetJoueurs(userClient),
            () => this.simulateCreateMessage(userClient),
            () => this.simulateUpdateComposition(userClient),
        ];

        const action = actions[Math.floor(Math.random() * actions.length)];
        await action();
    }

    // Simulation d'appel à l'endpoint dashboard joueur
    async simulateGetDashboard(userClient) {
        return this.makeRequest(userClient, 'dashboard-joueur', async () => {
            const { data: user } = await userClient.client
                .from('utilisateurs')
                .select('*')
                .limit(1);
            const { data: joueur } = await userClient.client.from('joueurs').select('*').limit(1);
            const { data: events } = await userClient.client
                .from('evenements')
                .select('*')
                .limit(10);
            return { user, joueur, events };
        });
    }

    // Simulation d'appel aux convocations
    async simulateGetConvocations(userClient) {
        return this.makeRequest(userClient, 'convocations', async () => {
            const { data } = await userClient.client
                .from('evenements')
                .select(
                    `
          *,
          participations_evenement(*)
        `,
                )
                .limit(20);
            return data;
        });
    }

    // Simulation de récupération des messages
    async simulateGetMessages(userClient) {
        return this.makeRequest(userClient, 'messages', async () => {
            const { data: prives } = await userClient.client
                .from('messages_prives')
                .select('*')
                .limit(50);
            const { data: groupes } = await userClient.client
                .from('messages_groupe_coach')
                .select('*')
                .limit(20);
            return { prives, groupes };
        });
    }

    // Simulation de récupération de l'équipe
    async simulateGetEquipe(userClient) {
        return this.makeRequest(userClient, 'equipe', async () => {
            const { data } = await userClient.client
                .from('joueurs')
                .select(
                    `
          *,
          utilisateurs(*),
          equipes(*)
        `,
                )
                .limit(25);
            return data;
        });
    }

    // Simulation de récupération des évaluations
    async simulateGetEvaluations(userClient) {
        return this.makeRequest(userClient, 'evaluations', async () => {
            const { data: mentales } = await userClient.client
                .from('evaluations_mentales')
                .select('*')
                .limit(10);
            const { data: techniques } = await userClient.client
                .from('evaluations_techniques')
                .select('*')
                .limit(10);
            return { mentales, techniques };
        });
    }

    // Simulation de mise à jour de participation
    async simulateUpdateParticipation(userClient) {
        return this.makeRequest(userClient, 'update-participation', async () => {
            // Simulation d'un upsert de participation
            const { data } = await userClient.client.from('participations_evenement').upsert({
                joueur_id: Math.floor(Math.random() * 100),
                evenement_id: Math.floor(Math.random() * 50),
                statut: ['present', 'absent', 'incertain'][Math.floor(Math.random() * 3)],
            });
            return data;
        });
    }

    // Simulation dashboard coach
    async simulateGetDashboardCoach(userClient) {
        return this.makeRequest(userClient, 'dashboard-coach', async () => {
            const { data: equipes } = await userClient.client.from('equipes').select('*').limit(5);
            const { data: events } = await userClient.client
                .from('evenements')
                .select('*')
                .limit(15);
            const { data: clubs } = await userClient.client.from('clubs').select('*').limit(3);
            return { equipes, events, clubs };
        });
    }

    // Simulation récupération équipes coach
    async simulateGetEquipes(userClient) {
        return this.makeRequest(userClient, 'equipes-coach', async () => {
            const { data } = await userClient.client
                .from('equipes')
                .select(
                    `
          *,
          joueurs(count)
        `,
                )
                .limit(10);
            return data;
        });
    }

    // Simulation récupération événements coach
    async simulateGetEvenements(userClient) {
        return this.makeRequest(userClient, 'evenements-coach', async () => {
            const { data } = await userClient.client
                .from('evenements')
                .select(
                    `
          *,
          participations_evenement(count),
          compositions(*)
        `,
                )
                .limit(20);
            return data;
        });
    }

    // Simulation récupération joueurs
    async simulateGetJoueurs(userClient) {
        return this.makeRequest(userClient, 'joueurs-coach', async () => {
            const { data } = await userClient.client
                .from('joueurs')
                .select(
                    `
          *,
          utilisateurs(*),
          evaluations_mentales(*),
          evaluations_techniques(*)
        `,
                )
                .limit(30);
            return data;
        });
    }

    // Simulation création message
    async simulateCreateMessage(userClient) {
        return this.makeRequest(userClient, 'create-message', async () => {
            const { data } = await userClient.client.from('messages_groupe_coach').insert({
                contenu: `Message de test ${Date.now()}`,
                expediteur_id: Math.floor(Math.random() * 10),
                equipe_id: Math.floor(Math.random() * 5),
            });
            return data;
        });
    }

    // Simulation mise à jour composition
    async simulateUpdateComposition(userClient) {
        return this.makeRequest(userClient, 'update-composition', async () => {
            const { data } = await userClient.client.from('compositions').upsert({
                evenement_id: Math.floor(Math.random() * 50),
                joueur_id: Math.floor(Math.random() * 100),
                poste: ['Gardien', 'Défenseur', 'Milieu', 'Attaquant'][
                    Math.floor(Math.random() * 4)
                ],
            });
            return data;
        });
    }

    // Wrapper pour les requêtes avec métriques
    async makeRequest(userClient, endpoint, requestFn) {
        const startTime = Date.now();

        try {
            const result = await requestFn();
            const responseTime = Date.now() - startTime;

            this.metrics.requests++;
            this.metrics.responseTimes.push(responseTime);
            this.metrics.requestsByEndpoint[endpoint] =
                (this.metrics.requestsByEndpoint[endpoint] || 0) + 1;

            userClient.lastAction = endpoint;
            this.log(`✅ User ${userClient.id} - ${endpoint} - ${responseTime}ms`);

            return result;
        } catch (error) {
            const responseTime = Date.now() - startTime;

            this.metrics.errors++;
            this.metrics.responseTimes.push(responseTime);
            this.metrics.errorsByType[error.message] =
                (this.metrics.errorsByType[error.message] || 0) + 1;

            this.logError(`❌ User ${userClient.id} - ${endpoint} - ERROR:`, error.message);

            throw error;
        }
    }

    // Boucle de simulation pour un utilisateur
    async runUserSimulation(userClient) {
        while (this.isRunning) {
            try {
                if (userClient.userType === 'joueur') {
                    await this.simulateJoueurScenario(userClient);
                } else if (userClient.userType === 'coach') {
                    await this.simulateCoachScenario(userClient);
                }

                // Pause aléatoire entre les actions (1-5 secondes)
                const pauseTime = Math.random() * 4000 + 1000;
                await this.sleep(pauseTime);
            } catch (error) {
                this.logError(`Erreur simulation user ${userClient.id}:`, error.message);
                await this.sleep(2000); // Pause plus longue en cas d'erreur
            }
        }
    }

    // Démarrage de la simulation
    async start() {
        console.log('🎯 Démarrage de la simulation de trafic SimplyFoot');
        console.log(`👥 Utilisateurs: ${this.config.users}`);
        console.log(`⏱️  Durée: ${this.config.duration / 1000}s`);
        console.log(`🚀 Montée en charge: ${this.config.rampUpTime / 1000}s`);
        console.log('━'.repeat(50));

        this.startTime = Date.now();
        this.isRunning = true;

        // Création et authentification des clients
        await this.createClients();
        await this.authenticateUsers();

        // Démarrage progressif des utilisateurs
        const rampUpDelay = this.config.rampUpTime / this.config.users;
        const simulations = [];

        for (let i = 0; i < this.clients.length; i++) {
            setTimeout(() => {
                if (this.isRunning) {
                    simulations.push(this.runUserSimulation(this.clients[i]));
                }
            }, i * rampUpDelay);
        }

        // Arrêt automatique après la durée configurée
        setTimeout(() => {
            this.stop();
        }, this.config.duration);

        // Affichage des métriques en temps réel
        this.startMetricsReporting();

        // Attendre l'arrêt
        await new Promise((resolve) => {
            const checkStop = () => {
                if (!this.isRunning) {
                    resolve();
                } else {
                    setTimeout(checkStop, 1000);
                }
            };
            checkStop();
        });
    }

    // Arrêt de la simulation
    stop() {
        console.log('\n🛑 Arrêt de la simulation...');
        this.isRunning = false;
        this.generateReport();
    }

    // Reporting des métriques en temps réel
    startMetricsReporting() {
        const interval = setInterval(() => {
            if (!this.isRunning) {
                clearInterval(interval);
                return;
            }

            const elapsed = (Date.now() - this.startTime) / 1000;
            const rps = this.metrics.requests / elapsed;

            console.log(
                `📊 ${elapsed.toFixed(0)}s | Req: ${this.metrics.requests} | RPS: ${rps.toFixed(1)} | Erreurs: ${this.metrics.errors}`,
            );
        }, 5000); // Toutes les 5 secondes
    }

    // Génération du rapport final
    generateReport() {
        const totalTime = (Date.now() - this.startTime) / 1000;
        const avgResponseTime =
            this.metrics.responseTimes.reduce((a, b) => a + b, 0) /
                this.metrics.responseTimes.length || 0;
        const maxResponseTime = Math.max(...this.metrics.responseTimes, 0);
        const minResponseTime = Math.min(...this.metrics.responseTimes, 0);
        const errorRate = (this.metrics.errors / this.metrics.requests) * 100 || 0;
        const rps = this.metrics.requests / totalTime;

        const report = {
            simulation: {
                users: this.config.users,
                duration: totalTime,
                scenarios: this.config.scenarios,
            },
            performance: {
                totalRequests: this.metrics.requests,
                requestsPerSecond: rps,
                errorCount: this.metrics.errors,
                errorRate: errorRate,
                responseTime: {
                    average: avgResponseTime,
                    min: minResponseTime,
                    max: maxResponseTime,
                },
            },
            endpoints: this.metrics.requestsByEndpoint,
            errors: this.metrics.errorsByType,
        };

        console.log('\n📈 RAPPORT DE SIMULATION');
        console.log('═'.repeat(50));
        console.log(`⏱️  Durée totale: ${totalTime.toFixed(1)}s`);
        console.log(`👥 Utilisateurs simulés: ${this.config.users}`);
        console.log(`📊 Requêtes totales: ${this.metrics.requests}`);
        console.log(`🚀 Requêtes/seconde: ${rps.toFixed(2)}`);
        console.log(`❌ Taux d'erreur: ${errorRate.toFixed(2)}%`);
        console.log(`⚡ Temps de réponse moyen: ${avgResponseTime.toFixed(0)}ms`);
        console.log(`🔺 Temps de réponse max: ${maxResponseTime}ms`);
        console.log(`🔻 Temps de réponse min: ${minResponseTime}ms`);

        console.log('\n📍 Endpoints les plus sollicités:');
        Object.entries(this.metrics.requestsByEndpoint)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([endpoint, count]) => {
                console.log(`  ${endpoint}: ${count} requêtes`);
            });

        if (Object.keys(this.metrics.errorsByType).length > 0) {
            console.log("\n⚠️  Types d'erreurs:");
            Object.entries(this.metrics.errorsByType).forEach(([error, count]) => {
                console.log(`  ${error}: ${count} fois`);
            });
        }

        // Sauvegarde du rapport
        const reportPath = path.join(
            process.cwd(),
            'scripts',
            'reports',
            `traffic-report-${Date.now()}.json`,
        );
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n💾 Rapport sauvegardé: ${reportPath}`);
    }

    // Utilitaires
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    log(message) {
        if (this.config.verbose) {
            console.log(`[${new Date().toISOString()}] ${message}`);
        }
    }

    logError(message, error) {
        console.error(`[${new Date().toISOString()}] ${message}`, error);
    }
}

// Fonction d'exécution principale
async function runSimulation() {
    console.log('🚦 Démarrage du simulateur de trafic SimplyFoot...');
    const config = {
        users: parseInt(process.argv[2]) || 10,
        duration: parseInt(process.argv[3]) || 60000,
        rampUpTime: parseInt(process.argv[4]) || 10000,
        scenarios: ['joueur', 'coach'],
        verbose: process.argv.includes('--verbose'),
    };

    const simulator = new TrafficSimulator(config);

    // Gestion de l'arrêt propre
    process.on('SIGINT', () => {
        simulator.stop();
    });

    await simulator.start();
}

// Export pour utilisation en module
export { TrafficSimulator };

// Exécution si appelé directement - Correction pour Windows
const isMainModule = () => {
    const currentUrl = import.meta.url;
    const mainUrl = `file:///${process.argv[1].replace(/\\/g, '/')}`;
    return currentUrl === mainUrl;
};

if (isMainModule()) {
    runSimulation().catch(console.error);
}
