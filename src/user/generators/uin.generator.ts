export async function uinGenerator(): Promise<string> {
    const generateRandomString = (length: number): string => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    };

    const uinPrefix = 'UIN-';
    const randomPart = generateRandomString(12); // Генеруємо 12 символів
    return `${uinPrefix}${randomPart}`;
}
