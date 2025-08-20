import {
    calculateAgeFromString,
    formatDateForDisplay,
    formatDateForInput,
    parseDateFromInput,
} from '@/utils/date.utils';

describe('date utilities', () => {
    describe('formatDateForDisplay', () => {
        it('should format the date correctly for display', () => {
            const date = new Date('2023-03-15');
            const formatted = formatDateForDisplay({ date });
            expect(formatted).toBe('15/03/2023');
        });

        it('should format the date correctly for en-US display', () => {
            const date = new Date('2023-03-15');
            const formatted = formatDateForDisplay({ date, locale: 'en-US' });
            expect(formatted).toBe('03/15/2023');
        });

        it('should return an empty string for undefined date', () => {
            const formatted = formatDateForDisplay({ date: undefined });
            expect(formatted).toBe('');
        });
    });

    describe('formatDateForInput', () => {
        it('should format the date correctly for input', () => {
            const date = new Date('2023-03-15');
            const formatted = formatDateForInput(date);
            expect(formatted).toBe('2023-03-15');
        });

        it('should return an empty string for undefined date', () => {
            const formatted = formatDateForInput(undefined);
            expect(formatted).toBeUndefined();
        });
    });

    describe('parseDateFromInput', () => {
        it('should parse the date correctly from input', () => {
            const dateString = '2023-03-15';
            const parsed = parseDateFromInput(dateString);
            expect(parsed).toEqual(new Date('2023-03-15'));
        });

        it('should return undefined for invalid date string', () => {
            const parsed = parseDateFromInput('invalid-date');
            expect(parsed).toBeUndefined();
        });
    });

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
