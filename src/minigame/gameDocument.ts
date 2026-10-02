import template from './assets/game.html?raw'
import gameStyle from './assets/game.css?inline'
import gameScript from './assets/game.js?raw'
import questions from './assets/questions.js?raw'
import sprites from './assets/sprites.json'
import beLatinRegular from '@fontsource/be-vietnam-pro/latin-400.css?inline'
import beLatinMedium from '@fontsource/be-vietnam-pro/latin-500.css?inline'
import beLatinBold from '@fontsource/be-vietnam-pro/latin-700.css?inline'
import beVietnameseRegular from '@fontsource/be-vietnam-pro/vietnamese-400.css?inline'
import beVietnameseMedium from '@fontsource/be-vietnam-pro/vietnamese-500.css?inline'
import beVietnameseBold from '@fontsource/be-vietnam-pro/vietnamese-700.css?inline'
import monoLatin from '@fontsource/ibm-plex-mono/latin-400.css?inline'
import monoVietnamese from '@fontsource/ibm-plex-mono/vietnamese-400.css?inline'

const fonts = [beLatinRegular, beLatinMedium, beLatinBold, beVietnameseRegular, beVietnameseMedium, beVietnameseBold, monoLatin, monoVietnamese].join('\n')
const script = (source: string) => `<script>${source.replace(/<\/script/gi, '<\\/script')}</script>`

// Vite resolves all fonts and scripts locally; the iframe needs no CDN or separate deployment.
export const gameDocument = template
  .replace('<!-- GAME_STYLES -->', `<style>${fonts}\n${gameStyle}</style>`)
  .replace('<!-- GAME_SCRIPTS -->', script(`window.GAME_SPRITES=${JSON.stringify(Object.fromEntries(Object.entries(sprites).map(([key,file])=>[key,`${import.meta.env.BASE_URL}minigame/sprites/${file}`])))};`) + script(questions) + script(gameScript))
