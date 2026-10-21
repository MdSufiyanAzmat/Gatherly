export const isEventFinished = (eventDate) => {
    const date = new Date(eventDate);
    if (Number.isNaN(date.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today;
};
