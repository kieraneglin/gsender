class GrblHalLineParserResultJSON {
    static parse(line) {
        // {...} json line
        const r = line.match(/^({.*})$/);
        if (!r) {
            return null;
        }

        console.log(r);

        const payload = {
            code: r[1]
        };

        return {
            type: GrblHalLineParserResultJSON,
            payload: payload
        };
    }
}

export default GrblHalLineParserResultJSON;
