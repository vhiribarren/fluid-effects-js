export async function textFileLoader(url) {
    return await fetch(url).then(r => r.text());
}