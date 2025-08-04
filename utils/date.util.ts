export const calculateAge = (birthdateStr: string) => {
    const birthdate = new Date(birthdateStr);
    let timeDiff = Math.abs(Date.now() - birthdate.getTime());
    let age = Math.floor(timeDiff / (1000 * 3600 * 24) / 365.25);

    return age;
};
