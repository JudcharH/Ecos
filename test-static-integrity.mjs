import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const htmlFiles=fs.readdirSync(".").filter(file=>file.endsWith(".html"));
for(const file of htmlFiles){
    const html=fs.readFileSync(file,"utf8");
    const ids=[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match=>match[1]);
    assert.equal(new Set(ids).size,ids.length,`${file} possui IDs HTML duplicados`);
    const assets=[...html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)=["']([^"']+)["']/gi)].map(match=>match[1].split("?")[0]).filter(asset=>!/^https?:|^\/\//i.test(asset));
    for(const asset of assets){
        const local=asset.startsWith("/")?asset.slice(1):asset;
        if(!/\.(?:js|css)$/i.test(local))continue;
        assert.ok(fs.existsSync(path.normalize(local)),`${file} referencia arquivo ausente: ${asset}`);
    }
}
console.log(JSON.stringify({ok:true,pages:htmlFiles.length,assets:true,duplicateIds:false},null,2));
