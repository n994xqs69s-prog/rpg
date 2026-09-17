# 🪙 Aurils — Gerenciador de Moedas de RPG

App web (pt-BR, tema fantasia dark) para controlar o tesouro do grupo durante a sessão.
HTML + CSS + JS puros, sem build e sem backend — os dados ficam no `localStorage` do navegador.

## Sistema de moedas

| Moeda | Equivalência | Em aurils |
|---|---|---|
| 🔵 Platina | 1 = 10 aurils | 10 A |
| 🟡 Auril (base) | 1 = 10 pratas | 1 A |
| ⚪ Prata | 1 = 10 copos | 0,10 A |
| 🟤 Copo | moeda menor | 0,01 A |

Toda a matemática é feita internamente em **copos inteiros**, sem erros de arredondamento.

## Funcionalidades

- 🏆 **Tesouro** — recrute personagens com tesouro inicial, veja a cotação por moeda, o total em aurils de cada um e do grupo, com botões +/− por moeda para troco rápido na mesa.
- 📜 **Transações** — ganho/gasto em qualquer moeda, histórico datado com descrição e botão de desfazer.
- ⚖️ **Mercado** — 17 itens prontos (poção de vida 2 A, cota de malha 120 A, cavalo 150 A…), compra e venda (venda a 50%) e cadastro de itens próprios.
- 🔁 **Conversor** — qualquer valor em qualquer moeda convertido em todas as outras, ao vivo, com troco exato.
- ⚙️ **Sistema** — regras da moeda, backup JSON (exportar/importar para levar a campanha do computador ao celular) e recomeço.

## Rodando localmente

```bash
npm run dev   # http://localhost:3000
```

Ou abra `index.html` direto no navegador.

## Deploy na Vercel

O projeto é estático e já vem com `vercel.json`.

1. Importe o repositório em [vercel.com/new](https://vercel.com/new).
2. Framework Preset: **Other**.
3. Build Command: vazio · Output Directory: `.` (raiz) · Install Command: vazio.
4. Deploy.

Ou pela CLI:

```bash
npx vercel        # preview
npx vercel --prod # produção
```

## Estrutura

```
index.html            # telas e abas
styles.css            # tema fantasia dark
app.js                # moedas, carteira, transações, mercado, backup
vercel.json           # configuração de deploy estático
manifest.webmanifest  # instalação como app no celular
```
