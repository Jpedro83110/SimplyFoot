export const calculateAge = (birthdateStr: string) => {
    let birthdate: Date;

    if (birthdateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        birthdate = new Date(birthdateStr);
    } else if (birthdateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        const [day, month, year] = birthdateStr.split('/').map(Number);
        birthdate = new Date(year, month - 1, day);
    } else {
        throw new Error('Invalid date format. Use YYYY-MM-DD or DD/MM/YYYY.');
    }

    let timeDiff = Math.abs(Date.now() - birthdate.getTime());
    let age = Math.floor(timeDiff / (1000 * 3600 * 24) / 365.25);

    return age;
};
