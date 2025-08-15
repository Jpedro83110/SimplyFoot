import { calculateAgeFromString } from '@/utils/date.util';

describe('date utilities', () => {
    describe('calculateAgeFromString', () => {
        it('should return the correct age with an YYYY-MM-DD date format', () => {
            const now = new Date();
            const birthdate = new Date(now.getTime() - 1000 * 3600 * 24 * 365.25 * 33);
            const birthdateStr = birthdate.toISOString().split('T')[0];
            const expectedAge = 33;

            expect(birthdateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);

            const age = calculateAgeFromString(birthdateStr);
            expect(age).toBe(expectedAge);
        });

        it('should return the correct age with an DD/MM/YYYY date format', () => {
            const now = new Date();
            const birthdate = new Date(now.getTime() - 1000 * 3600 * 24 * 365.25 * 33);
            const birthdateStr = birthdate.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
            });
            const expectedAge = 33;

            expect(birthdateStr).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);

            const age = calculateAgeFromString(birthdateStr);
            expect(age).toBe(expectedAge);
        });
    });
});
