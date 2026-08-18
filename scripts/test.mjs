#!/usr/bin/env node
/**
 * Descobre e roda todo *.test.ts do projeto via node:test (através do tsx).
 *
 * Implementado com módulos nativos do Node (fs/path/child_process) em vez de
 * um test runner externo (Jest/Vitest), para não introduzir dependência de
 * framework — ver docs/PLANO_DESENVOLVIMENTO.md, seção 3.
 */
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";

const IGNORAR = new Set(["node_modules", ".next", ".git"]);

function encontrarArquivosDeTeste(diretorio, encontrados = []) {
  for (const nome of readdirSync(diretorio)) {
    if (IGNORAR.has(nome)) continue;
    const caminho = join(diretorio, nome);
    const info = statSync(caminho);
    if (info.isDirectory()) {
      encontrarArquivosDeTeste(caminho, encontrados);
    } else if (nome.endsWith(".test.ts") || nome.endsWith(".test.tsx")) {
      encontrados.push(caminho);
    }
  }
  return encontrados;
}

const raiz = process.cwd();
const arquivos = encontrarArquivosDeTeste(raiz).map((f) => relative(raiz, f));

if (arquivos.length === 0) {
  console.log("Nenhum arquivo *.test.ts encontrado.");
  process.exit(0);
}

console.log(`Rodando ${arquivos.length} arquivo(s) de teste:\n${arquivos.map((f) => `  - ${f}`).join("\n")}\n`);

const resultado = spawnSync("npx", ["tsx", "--test", ...arquivos], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(resultado.status ?? 1);
