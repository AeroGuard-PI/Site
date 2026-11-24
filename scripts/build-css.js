const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

const rootDirectory = path.resolve(__dirname, "..");
const sourceFile = path.join(rootDirectory, "public", "css", "style.css");
const outputDirectory = path.join(rootDirectory, "public", "assets", "css");
const outputFile = path.join(outputDirectory, "bundle.min.css");
const indexFile = path.join(rootDirectory, "public", "index.html");

async function buildCss() {
  fs.mkdirSync(outputDirectory, { recursive: true });

  await esbuild.build({
    entryPoints: [sourceFile],
    outfile: outputFile,
    bundle: true,
    minify: true,
    external: ["/assets/*"],
    legalComments: "none",
    logLevel: "silent"
  });

  const bundle = fs.readFileSync(outputFile);
  const version = crypto.createHash("sha256").update(bundle).digest("hex").slice(0, 12);
  const index = fs.readFileSync(indexFile, "utf8");
  const bundleLink = `href="assets/css/bundle.min.css?v=${version}"`;
  const sourceLinkPattern = /href="css\/style\.css"/;
  const bundleLinkPattern = /href="assets\/css\/bundle\.min\.css(?:\?v=[a-f0-9]+)?"/;

  if (!sourceLinkPattern.test(index) && !bundleLinkPattern.test(index)) {
    throw new Error("Não foi encontrado o link do CSS da página inicial para atualizar.");
  }

  const updatedIndex = index
    .replace(sourceLinkPattern, bundleLink)
    .replace(bundleLinkPattern, bundleLink);

  if (updatedIndex !== index) {
    fs.writeFileSync(indexFile, updatedIndex);
  }
  console.log(`CSS gerado: public/assets/css/bundle.min.css?v=${version}`);
}

buildCss().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
