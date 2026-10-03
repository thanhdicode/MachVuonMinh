import template from './assets/game.html?raw'
import gameStyle from './assets/game.css?inline'
import guideStyle from '../onboarding/guideGame.css?inline'
import gameScript from './assets/game.js?raw'
import backgroundScript from './assets/game-background.js?raw'
import presentationScript from './assets/runner-presentation.js?raw'
import audioScript from './assets/game-audio.js?raw'
import runnerAssets from '../../public/minigame/runner/manifest.json'
import guideScript from '../onboarding/game-guide.js?raw'
import questions from './assets/questions.js?raw'
import documentQuestions from './assets/document-questions.js?raw'
import sprites from './assets/sprites.json'
import beLatinRegular from '@fontsource/be-vietnam-pro/latin-400.css?inline'
import beLatinMedium from '@fontsource/be-vietnam-pro/latin-500.css?inline'
import beLatinBold from '@fontsource/be-vietnam-pro/latin-700.css?inline'
import beVietnameseRegular from '@fontsource/be-vietnam-pro/vietnamese-400.css?inline'
import beVietnameseMedium from '@fontsource/be-vietnam-pro/vietnamese-500.css?inline'
import beVietnameseBold from '@fontsource/be-vietnam-pro/vietnamese-700.css?inline'
import monoLatin from '@fontsource/ibm-plex-mono/latin-400.css?inline'
import monoVietnamese from '@fontsource/ibm-plex-mono/vietnamese-400.css?inline'
import { scriptSafeJson } from '../onboarding/gameGuideProtocol'
import type { GameChildConfig } from '../onboarding/gameGuideProtocol'

const fonts = [beLatinRegular, beLatinMedium, beLatinBold, beVietnameseRegular, beVietnameseMedium, beVietnameseBold, monoLatin, monoVietnamese].join('\n')
const script = (source: string) => `<script>${source.replace(/<\/script/gi, '<\\/script')}</script>`
const spriteUrls = Object.fromEntries(Object.entries(sprites).map(([key, file]) => [key, `${import.meta.env.BASE_URL}minigame/sprites/${file}`]))
const runnerBaseUrl = `${import.meta.env.BASE_URL}minigame/runner/`
const runnerSpriteUrls = Object.fromEntries(Object.entries(runnerAssets.sprites).map(([key, file]) => [key, `${runnerBaseUrl}${file}`]))

// One srcdoc per open: the nonce, the expected origin and the catalog steps are baked in, so nothing is fetched or guessed.
// Vite resolves all fonts and scripts locally; the iframe needs no CDN. Driver.js itself is loaded lazily from the vendored copy.
export function buildGameDocument(config: GameChildConfig): string {
  const guided = config.guide !== null
  return template
    .replace('<!-- GAME_STYLES -->', `<style>${fonts}\n${gameStyle}${guided ? `\n${guideStyle}` : ''}</style>`)
    .replace('<!-- GAME_SCRIPTS -->', () => [
      script(`window.GAME_SPRITES=${JSON.stringify(spriteUrls)};`),
      script(`window.MACH_RUNNER_ASSETS=${scriptSafeJson({ baseUrl: runnerBaseUrl, sprites: runnerSpriteUrls, animations: runnerAssets.animations })};`),
      script(questions),
      script(documentQuestions),
      script(`window.MACH_GAME_CONFIG=${scriptSafeJson(config)};`),
      script(backgroundScript),
      script(presentationScript),
      script(audioScript),
      script(gameScript),
      guided ? script(guideScript) : '',
    ].join(''))
}
