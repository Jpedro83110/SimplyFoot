export const formatDateForDisplay = ({
    date,
    locale,
}: {
    date?: Date | string;
    locale?: string;
}) => {
    if (!date) {
        return '';
    }

    const parsedDate = typeof date === 'string' ? parseDateFromYYYYMMDD(date) : date;

    return (
        parsedDate?.toLocaleDateString(locale || 'fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }) ?? ''
    );
};

export const formatDateToYYYYMMDD = (date?: Date) => {
    if (!date) {
        return date;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

export const parseDateFromYYYYMMDD = (dateString: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return undefined;
    }

    // const [year, month, day] = dateString.split('-').map(Number);
    return new Date(dateString);
};

export const normalizeHour = (hourStr?: string) => {
    if (
        !hourStr ||
        (!/^\d{1,2}([hH]\d{2})?$/.test(hourStr) &&
            !/^\d{1,2}:\d{2}$/.test(hourStr) &&
            !/^\d{1,2}[hH]$/.test(hourStr))
    ) {
        return '';
    }

    // Remove spaces and replace 'h' with ':'
    const cleaned = hourStr.replace(/\s/g, '').replace(/[hH]/g, ':');
    const [hours, minutes] = cleaned.split(':');

    // Pad hours and minutes to ensure two digits
    const paddedHours = String(hours).padStart(2, '0');
    const paddedMinutes = String(minutes || '00').padStart(2, '0');

    return `${paddedHours}:${paddedMinutes}`;
};

export const calculateAgeFromString = (birthdateStr: string) => {
    let birthdate: Date;

    if (birthdateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        birthdate = new Date(birthdateStr);
    } else if (birthdateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
        const [day, month, year] = birthdateStr.split('/').map(Number);
        birthdate = new Date(year, month - 1, day);
    } else {
        throw new Error('Invalid date format. Use YYYY-MM-DD or DD/MM/YYYY.');
    }

    return calculateAge(birthdate);
};

export const calculateAge = (birthdate: Date) => {
    let timeDiff = Math.abs(Date.now() - birthdate.getTime());
    let age = Math.floor(timeDiff / (1000 * 3600 * 24) / 365.25);

    return age;
};
