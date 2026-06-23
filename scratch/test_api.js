async function run() {
    // Generate a 4000 char Kannada string
    const longText = 'ಹರಿ '.repeat(1000); // 1000 * 4 = 4000 chars
    const url = `https://aksharamukha.appspot.com/api/public?source=Kannada&target=IAST&text=${encodeURIComponent(longText)}`;
    console.log("URL Length: ", url.length);
    const res = await fetch(url);
    if (!res.ok) {
        console.log("Error: ", res.status);
    } else {
        const text = await res.text();
        console.log("Success! Length of output: ", text.length);
    }
}
run();
