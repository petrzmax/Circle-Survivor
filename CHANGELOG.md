# Changelog

## [2.3.0](https://github.com/petrzmax/Circle-Survivor/compare/v2.2.2...v2.3.0) (2026-03-20)


### ✨ Features

* add settings component for volume control and leaderboard management ([dd34cba](https://github.com/petrzmax/Circle-Survivor/commit/dd34cba6a4611dd4cd4e670135ed4c4bf3cbd79d))
* mini banana dmg & radius level scaling and tooltip ([3d1bb7e](https://github.com/petrzmax/Circle-Survivor/commit/3d1bb7eee5522c12e215db854e6a07d401ec9517))


### 🐛 Bug Fixes

* buying higher level weapon ([fc9233b](https://github.com/petrzmax/Circle-Survivor/commit/fc9233ba4bcae2ad1b16ede63541d6103523fd03))
* weapon upgrade logic ([67d5310](https://github.com/petrzmax/Circle-Survivor/commit/67d5310c8cc0c53bdd04cb82f874bf5d5378afac))


### ♻️ Refactoring

* items apply stats unification ([46e3b8a](https://github.com/petrzmax/Circle-Survivor/commit/46e3b8a21422a879a00908bcb4b0ba23612c29b0))

## [2.2.2](https://github.com/petrzmax/Circle-Survivor/compare/v2.2.1...v2.2.2) (2026-03-19)


### ⚖️ Balance Changes

* **balance:** adjust enemy fire rates and weapon projectile mass for balance ([cf6eb6e](https://github.com/petrzmax/Circle-Survivor/commit/cf6eb6ee542b8fb67ad003c2bb0589c7437f3bad))


### 🐛 Bug Fixes

* desynchronize enemies firing ([a2629d4](https://github.com/petrzmax/Circle-Survivor/commit/a2629d45e650882f1772586c03e9187c897c429f))
* scrollbar styling ([7bb67a5](https://github.com/petrzmax/Circle-Survivor/commit/7bb67a5cd277a9801616f55b453e536055f3747d))

## [2.2.1](https://github.com/petrzmax/Circle-Survivor/compare/v2.2.0...v2.2.1) (2026-03-19)


### ♻️ Refactoring

* css to saas & fix leaderboards save ([fb8c932](https://github.com/petrzmax/Circle-Survivor/commit/fb8c932cf77d6bf160f5e7f567d066c7a5e9a5d4))

## [2.2.0](https://github.com/petrzmax/Circle-Survivor/compare/v2.1.0...v2.2.0) (2026-03-19)


### ✨ Features

* enhance shop functionality with sold item indication and player physics adjustments ([dcefe5d](https://github.com/petrzmax/Circle-Survivor/commit/dcefe5de608317ee145c4fc3410530e8c28fa637))
* implement wave clear overlay and update game state transitions ([4a426a0](https://github.com/petrzmax/Circle-Survivor/commit/4a426a09fc8d6c3c3516c599b6961fe0f1e11459))
* player details on ranking & refactor and hud fixes ([d1eb2e7](https://github.com/petrzmax/Circle-Survivor/commit/d1eb2e775e3ba63cc3cd15111c57322a9b5469e6))

## [2.1.0](https://github.com/petrzmax/Circle-Survivor/compare/v2.0.0...v2.1.0) (2026-03-18)


### ✨ Features

* add physics impulse-based player movement ([b332ddb](https://github.com/petrzmax/Circle-Survivor/commit/b332ddbd400f62fd03e5a2cf3ed7f4adc4d24541))
* add shockwave knockback handling ([ee17722](https://github.com/petrzmax/Circle-Survivor/commit/ee17722416928eb2bbb21f787c37c71ff4811a31))
* enhance pickup mechanics with new attraction physics and explosion knockback ([a5e6034](https://github.com/petrzmax/Circle-Survivor/commit/a5e60345758c776f8c28da50d30d40c3372247e4))
* explosion knockback enemies ([ccb11f7](https://github.com/petrzmax/Circle-Survivor/commit/ccb11f7387b726566f2cf17e85fe33eee25cad82))
* force based enemy movement ([94da5d6](https://github.com/petrzmax/Circle-Survivor/commit/94da5d6de5934180857b0987e95eb615efba25b8))
* implement steady-state force factor for player and enemy movement ([4a6da37](https://github.com/petrzmax/Circle-Survivor/commit/4a6da37cbd24f5660a23d47add5c3b27904cfac0))
* introduce layout configuration and improve tooltip positioning ([92e2056](https://github.com/petrzmax/Circle-Survivor/commit/92e205698a5510ea4134785b2cbe6c16f703db5a))
* refactor enemy mass handling and introduce mass calculation from radius ([0aed927](https://github.com/petrzmax/Circle-Survivor/commit/0aed927a1df36dab2fee80ab383413c643c4bc10))
* update weapon configurations to use projectile mass for momentum-based knockback ([c7ff49c](https://github.com/petrzmax/Circle-Survivor/commit/c7ff49c7c57a8d6b04917dc21da2bebfb297f27f))


### ⚖️ Balance Changes

* **balance:** adjust projectile mass values for various weapon types ([b1210e4](https://github.com/petrzmax/Circle-Survivor/commit/b1210e491597ad446e2231406e7e2782f9d784c4))


### 🐛 Bug Fixes

* attraction not working ([a369711](https://github.com/petrzmax/Circle-Survivor/commit/a3697118f77afc2223e83a5abd2f9fb41c621b0d))
* mini banana rotation ([5e048ba](https://github.com/petrzmax/Circle-Survivor/commit/5e048ba307aa4cc8dfc3ecb5606ca40ab4ff60c3))


### ♻️ Refactoring

* enemy and pickup attraction movement calculations ([7b7bd1f](https://github.com/petrzmax/Circle-Survivor/commit/7b7bd1fad833d1dc18c12f276668e82ee78a1544))
* format imports for consistency across multiple files ([e8f7343](https://github.com/petrzmax/Circle-Survivor/commit/e8f73435da8b151508e32096183e2b669ce60452))

## [2.0.0](https://github.com/petrzmax/Circle-Survivor/compare/v1.11.0...v2.0.0) (2026-03-16)


### ⚠ BREAKING CHANGES

* migrate to Koota ECS

### ✨ Features

* add enemy-enemy collision detection and separation force handling ([93dad5e](https://github.com/petrzmax/Circle-Survivor/commit/93dad5e6b6e861973595bf3ecedd4a1a970e7da1))
* add simple loading screen ([cf99d64](https://github.com/petrzmax/Circle-Survivor/commit/cf99d64b14e754576efaa27e60a8ba8dcb2ba87a))
* add touch support with virtual joystick and fullscreen toggle for mobile devices ([d023ba9](https://github.com/petrzmax/Circle-Survivor/commit/d023ba94cfcfdab895f0f051f2cd2004322a9ac2))
* implement physics system for force-based movement and friction decay ([0e35477](https://github.com/petrzmax/Circle-Survivor/commit/0e35477db8d12e6a51b71858d95595cc6823ed29))
* make boss attacks less predictable ([9f083fa](https://github.com/petrzmax/Circle-Survivor/commit/9f083fac2ce3ac09134337450862b13725aba00e))
* migrate to Koota ECS ([04510e9](https://github.com/petrzmax/Circle-Survivor/commit/04510e9908b4cf2997bd156e130df66b7adb4cee))


### ♻️ Refactoring

* split combat system into smaller systems ([91010a8](https://github.com/petrzmax/Circle-Survivor/commit/91010a884f4aed35b13f57381f9eb65fc54bd5c6))


### 📦 Other Changes

* add guideline to avoid using abbreviations for field names ([3a2469f](https://github.com/petrzmax/Circle-Survivor/commit/3a2469fc5644c3b9450bfbb8198811cc1c3d992d))
* **deps:** bump @preact/preset-vite from 2.10.3 to 2.10.4 ([#96](https://github.com/petrzmax/Circle-Survivor/issues/96)) ([e4f83b3](https://github.com/petrzmax/Circle-Survivor/commit/e4f83b35a44d55f3249449853f4a54144d721610))
* **deps:** bump @types/node from 25.2.3 to 25.3.3 ([#87](https://github.com/petrzmax/Circle-Survivor/issues/87)) ([828f0db](https://github.com/petrzmax/Circle-Survivor/commit/828f0db93c8d777e794be4af7f41683f8b0b3250))
* **deps:** bump @types/node from 25.3.3 to 25.3.5 ([#93](https://github.com/petrzmax/Circle-Survivor/issues/93)) ([0dcae33](https://github.com/petrzmax/Circle-Survivor/commit/0dcae3392065f616f64abeb852e5a64a204ad6af))
* **deps:** bump @typescript-eslint/eslint-plugin from 8.56.0 to 8.56.1 ([#90](https://github.com/petrzmax/Circle-Survivor/issues/90)) ([c6f89de](https://github.com/petrzmax/Circle-Survivor/commit/c6f89dee03e18848b4d7acd5632bd4884db705ed))
* **deps:** bump @typescript-eslint/parser from 8.56.0 to 8.56.1 ([#88](https://github.com/petrzmax/Circle-Survivor/issues/88)) ([c29fc36](https://github.com/petrzmax/Circle-Survivor/commit/c29fc3651cc0e54300d0d91017e39dd15daf068f))
* **deps:** bump eslint from 9.39.2 to 10.0.3 ([#92](https://github.com/petrzmax/Circle-Survivor/issues/92)) ([9d2df0f](https://github.com/petrzmax/Circle-Survivor/commit/9d2df0f2266e09ad83b6f2865cb3f041b4896b0b))
* **deps:** bump jsdom from 28.1.0 to 29.0.0 ([#95](https://github.com/petrzmax/Circle-Survivor/issues/95)) ([b497821](https://github.com/petrzmax/Circle-Survivor/commit/b497821450877ae3909d64c5c591bfd41584d6ea))
* **deps:** bump preact from 10.28.3 to 10.28.4 ([#82](https://github.com/petrzmax/Circle-Survivor/issues/82)) ([f3e05a4](https://github.com/petrzmax/Circle-Survivor/commit/f3e05a4638975f86af6a0fdccd827bb829cc58b0))
* **deps:** bump typescript-eslint from 8.55.0 to 8.56.0 ([#81](https://github.com/petrzmax/Circle-Survivor/issues/81)) ([674a959](https://github.com/petrzmax/Circle-Survivor/commit/674a9599cbc1549bb41bde2ed66e747049314dd5))
* **deps:** bump typescript-eslint from 8.56.0 to 8.56.1 ([#91](https://github.com/petrzmax/Circle-Survivor/issues/91)) ([45110ce](https://github.com/petrzmax/Circle-Survivor/commit/45110ce6399dac29294b981d990356ff82e78649))
* **deps:** bump vite from 7.3.1 to 8.0.0 ([#97](https://github.com/petrzmax/Circle-Survivor/issues/97)) ([a5cded2](https://github.com/petrzmax/Circle-Survivor/commit/a5cded2af09b7e3e22af338703fce584ae91436a))
* **deps:** bump vitest from 4.0.18 to 4.1.0 ([#94](https://github.com/petrzmax/Circle-Survivor/issues/94)) ([f60a9d4](https://github.com/petrzmax/Circle-Survivor/commit/f60a9d41329857078a02d5ecb0696139dea19a39))
* fix typo ([a5fbaaf](https://github.com/petrzmax/Circle-Survivor/commit/a5fbaafebf9ef56ba90c77e46fe284959049043f))
* update copilot instructions ([39871f1](https://github.com/petrzmax/Circle-Survivor/commit/39871f116d297faa91a36f09391bc4fb70089b3f))

## [1.11.0](https://github.com/petrzmax/Circle-Survivor/compare/v1.10.1...v1.11.0) (2026-02-20)


### ✨ Features

* add explosion damage falloff ([41afbdb](https://github.com/petrzmax/Circle-Survivor/commit/41afbdbc9df0d1a7d389ede2772adc19e456e049))
* add items page in shop ([09cab35](https://github.com/petrzmax/Circle-Survivor/commit/09cab357fc8d288e0f43c9fa036a5577c193ea99))
* items panel and tooltip, player stats ([b8aa105](https://github.com/petrzmax/Circle-Survivor/commit/b8aa105079dce9561af23120757226604396b5c1))
* random boss type on boss waves ([9943240](https://github.com/petrzmax/Circle-Survivor/commit/994324064fe87c1e4e7e04e81369f722a6acf854))
* rework in game hud ([6b86fcd](https://github.com/petrzmax/Circle-Survivor/commit/6b86fcd26bdd895efef817b8e05715b2c2baac6c))
* update item descriptions and enhance inventory UI ([7c7bd39](https://github.com/petrzmax/Circle-Survivor/commit/7c7bd39119e27738841c20219d4c72e6b34e1c86))


### ⚖️ Balance Changes

* **balance:** adjust explosion falloff and explosion radius multiplier ([735df1d](https://github.com/petrzmax/Circle-Survivor/commit/735df1da092135cfea5107fb202a1829e21f593f))


### 🐛 Bug Fixes

* remove velocity inheritance from projectiles ([eb7d218](https://github.com/petrzmax/Circle-Survivor/commit/eb7d2187d5686822310c8a6a42a155fbc90d7d14))
* render armor only when &gt; 0 ([9418c99](https://github.com/petrzmax/Circle-Survivor/commit/9418c99c01cd410eca9de0df6fa0fcd3d6eb022b))


### ♻️ Refactoring

* format code ([2d1a6eb](https://github.com/petrzmax/Circle-Survivor/commit/2d1a6ebbe3e59ad8617945035c2b8735d2ac2317))
* remove dead code ([b6be5fc](https://github.com/petrzmax/Circle-Survivor/commit/b6be5fc2d315eb31c10ba0e63849d47069c81160))


### 📦 Other Changes

* **balance:** rework thorns to reflect % of damage taken, lifesteal to chance-based 1HP heal ([c812e58](https://github.com/petrzmax/Circle-Survivor/commit/c812e5808fae231aca6104cd50037fd319c703c7))

## [1.10.1](https://github.com/petrzmax/Circle-Survivor/compare/v1.10.0...v1.10.1) (2026-02-20)


### 🐛 Bug Fixes

* make movement and effects independent from fps ([58906a6](https://github.com/petrzmax/Circle-Survivor/commit/58906a68afdf4697172c4dff7c6ca4dfea3cdd70))
* speed display in ui ([e6f8a0c](https://github.com/petrzmax/Circle-Survivor/commit/e6f8a0cec7dc750aae7f7f726a52b25ba3127f76))


### ♻️ Refactoring

* enemy spawning system and scaling mechanics ([3895805](https://github.com/petrzmax/Circle-Survivor/commit/3895805d8bbd5f522c4c992ad7b7893b87bc8a21))
* extract core systems from game ([574f414](https://github.com/petrzmax/Circle-Survivor/commit/574f414a733c53007ada4002f9599858ac0fa477))
* pickup attraction system ([2b49182](https://github.com/petrzmax/Circle-Survivor/commit/2b491826cb57a9dc7aae2fa287804b8d9c72c8f8))
* streamline audio event handling in Menu component ([c537250](https://github.com/petrzmax/Circle-Survivor/commit/c537250355b0f65a1d7a4b6f38f5e6d497160989))


### 📦 Other Changes

* **deps:** bump @types/node from 25.2.2 to 25.2.3 ([#73](https://github.com/petrzmax/Circle-Survivor/issues/73)) ([c02c87f](https://github.com/petrzmax/Circle-Survivor/commit/c02c87f22ef6c19cb84f9e11a8436a8a22e9417f))
* **deps:** bump @typescript-eslint/parser from 8.54.0 to 8.55.0 ([#74](https://github.com/petrzmax/Circle-Survivor/issues/74)) ([38e6f69](https://github.com/petrzmax/Circle-Survivor/commit/38e6f69adf7c57c28968ad3411d3aa7352b9deff))
* **deps:** bump jsdom from 28.0.0 to 28.1.0 ([#75](https://github.com/petrzmax/Circle-Survivor/issues/75)) ([e2ea022](https://github.com/petrzmax/Circle-Survivor/commit/e2ea02208c62abe3b073625616706cc0f302bf12))
* **deps:** bump typescript-eslint from 8.54.0 to 8.55.0 ([#77](https://github.com/petrzmax/Circle-Survivor/issues/77)) ([8786b5e](https://github.com/petrzmax/Circle-Survivor/commit/8786b5e06c1a3a99ca0d89d5e4b2790274f3a678))

## [1.10.0](https://github.com/petrzmax/Circle-Survivor/compare/v1.9.0...v1.10.0) (2026-02-12)


### ✨ Features

* Add new sounds for enemy attack patterns ([43659f3](https://github.com/petrzmax/Circle-Survivor/commit/43659f303f1853281a12be14ac7454e0944c658e))
* implement object pooling for effects system ([b586fe0](https://github.com/petrzmax/Circle-Survivor/commit/b586fe0fdf1d11f3850955a569be801805bac6c6))
* implement weapon merging ([2f4a978](https://github.com/petrzmax/Circle-Survivor/commit/2f4a97843a1a670b761913d1cf6c1683274e9e01))


### 🐛 Bug Fixes

* clean particles after game reset ([656fb4f](https://github.com/petrzmax/Circle-Survivor/commit/656fb4fa535473d599e3cb80a0272f1c5b04a753))
* increase maximum limits for death particles and explosions ([e707891](https://github.com/petrzmax/Circle-Survivor/commit/e707891fcf7ecd6b4ea7de6be2fbf44481601045))
* reset effects system on game reset ([14f39d2](https://github.com/petrzmax/Circle-Survivor/commit/14f39d251b93bbc48919db910cacc26f058988f0))
* shockwave rendering order ([bbbfc73](https://github.com/petrzmax/Circle-Survivor/commit/bbbfc73ea0dc5c6c8ef6c4133445962d348129fd))


### ♻️ Refactoring

* refactor shop logic for improved state management ([9ee6166](https://github.com/petrzmax/Circle-Survivor/commit/9ee616681b4a1d0b1c417ca5835a90d059ccaeb0))
* reorganize imports and simplify AudioContext initialization ([16d0083](https://github.com/petrzmax/Circle-Survivor/commit/16d00838f6ddcc98fe1207153b8fdd46dcc1911a))
* simplify enemy death handling and explosion processing ([4e991e8](https://github.com/petrzmax/Circle-Survivor/commit/4e991e88cd88f85dfd282b7ad518f521cc226f6e))


### 📚 Documentation

* add note to separate interfaces from implementations in type.ts files ([ea90f14](https://github.com/petrzmax/Circle-Survivor/commit/ea90f1471363ebae3c61ba894ecbfffda5222916))
* update project conventions for code utility usage and config injection ([720261b](https://github.com/petrzmax/Circle-Survivor/commit/720261b6e7caba48f7ed27f69e9c9fcfe8d55b35))


### 📦 Other Changes

* **deps:** bump @babel/plugin-proposal-decorators ([#65](https://github.com/petrzmax/Circle-Survivor/issues/65)) ([367f3ec](https://github.com/petrzmax/Circle-Survivor/commit/367f3ece0b0c18c1e1ebd894d747fbafb982c0bf))
* **deps:** bump @preact/preset-vite from 2.10.2 to 2.10.3 ([#71](https://github.com/petrzmax/Circle-Survivor/issues/71)) ([e19ec1c](https://github.com/petrzmax/Circle-Survivor/commit/e19ec1c4d747f18c33c06d7c1d686a82a884c0f0))
* **deps:** bump @types/node from 25.0.10 to 25.2.2 ([#70](https://github.com/petrzmax/Circle-Survivor/issues/70)) ([bc373af](https://github.com/petrzmax/Circle-Survivor/commit/bc373af4cf9e7cd618bdf052010a49111def1a75))
* **deps:** bump jsdom from 27.4.0 to 28.0.0 ([#69](https://github.com/petrzmax/Circle-Survivor/issues/69)) ([7e0c7ce](https://github.com/petrzmax/Circle-Survivor/commit/7e0c7ceb57178b41f0308f71f6139f015117a421))
* **deps:** bump preact from 10.28.2 to 10.28.3 ([#67](https://github.com/petrzmax/Circle-Survivor/issues/67)) ([8dd8e5e](https://github.com/petrzmax/Circle-Survivor/commit/8dd8e5ea6be51f4ab5e1842112a8a9f066c4ca03))
* **deps:** bump typescript-eslint from 8.53.1 to 8.54.0 ([#66](https://github.com/petrzmax/Circle-Survivor/issues/66)) ([b2fd338](https://github.com/petrzmax/Circle-Survivor/commit/b2fd338c687de5592683815fe3ea2657d53fb82f))

## [1.9.0](https://github.com/petrzmax/Circle-Survivor/compare/v1.8.1...v1.9.0) (2026-01-30)


### ✨ Features

* add new boss names ([e2f17ca](https://github.com/petrzmax/Circle-Survivor/commit/e2f17caf109446799091588f9ad3cf7780258d60))
* add weapon statistics tooltip ([6239cdf](https://github.com/petrzmax/Circle-Survivor/commit/6239cdf62da789d9dabfe765e3e5a070e87be2a9))
* velocity inheritance for enemy and player projectiles ([c737d8c](https://github.com/petrzmax/Circle-Survivor/commit/c737d8c47b86caf42b7609f2eb2d82e61c328572))


### ⚖️ Balance Changes

* **balance:** adjust pierce for pierce weapons ([379b94a](https://github.com/petrzmax/Circle-Survivor/commit/379b94a2fe8d7ea330ccbad25472e9aec55012b2))


### 🐛 Bug Fixes

* add cooldown to crossbow sound to prevent overlapping audio ([7349280](https://github.com/petrzmax/Circle-Survivor/commit/7349280eea4c509de60d74e6d229990753e67a80))
* add cooldown to dodge, to avoid sound glitch ([5625cab](https://github.com/petrzmax/Circle-Survivor/commit/5625cab2bea9118cf8f4a21fa0f89dbbc43856ac))
* remove trailing zeros from cooldown ([982e6db](https://github.com/petrzmax/Circle-Survivor/commit/982e6dbcac928ae86541a113d3ef60e98dbe8a78))
* update toast notification for weapon sale and adjust Shop import path ([69fa574](https://github.com/petrzmax/Circle-Survivor/commit/69fa5747be6ae9e1f5a2fd0ee989261dbeaf5d46))
* weapon upgrade tooltip, and weapon sell price not affected by level ([b77f9d4](https://github.com/petrzmax/Circle-Survivor/commit/b77f9d4892afc3c61b5bc5d562c81c44cd078912))


### ♻️ Refactoring

* implement dependency injection with tsyringe ([e2aa302](https://github.com/petrzmax/Circle-Survivor/commit/e2aa3025301f624dcde16842577455cb260a411d))
* migrate DevMenu to preact ([108ad98](https://github.com/petrzmax/Circle-Survivor/commit/108ad980ff26cba375bf95460e82c829dd9bced3))
* migrate EventBus to new events directory and update imports ([c3cc9cd](https://github.com/petrzmax/Circle-Survivor/commit/c3cc9cd8340a0b477878969a939b7cc12717bfd6))
* move weapon logic to weaponManager ([901a652](https://github.com/petrzmax/Circle-Survivor/commit/901a652e5dd433b338d2fcb752e671760be16b3c))
* Player class and weapon management ([8eacf24](https://github.com/petrzmax/Circle-Survivor/commit/8eacf24fdb2250bcb9cc4a3ff07a81e500374a8c))


### 📦 Other Changes

* **deps:** bump @types/node from 25.0.9 to 25.0.10 ([#58](https://github.com/petrzmax/Circle-Survivor/issues/58)) ([3c2eae4](https://github.com/petrzmax/Circle-Survivor/commit/3c2eae4c1baf2477be1986731aed18e83fb45189))
* **deps:** bump @vitest/ui from 4.0.17 to 4.0.18 ([#62](https://github.com/petrzmax/Circle-Survivor/issues/62)) ([5107dd2](https://github.com/petrzmax/Circle-Survivor/commit/5107dd222ce4565eeae29118375b9c443a1cbf86))
* **deps:** bump prettier from 3.8.0 to 3.8.1 ([#61](https://github.com/petrzmax/Circle-Survivor/issues/61)) ([4a58713](https://github.com/petrzmax/Circle-Survivor/commit/4a5871331fef6f9ae87521ec81fa91ac7f393fcc))
* **deps:** bump typescript-eslint from 8.53.0 to 8.53.1 ([#60](https://github.com/petrzmax/Circle-Survivor/issues/60)) ([85553ab](https://github.com/petrzmax/Circle-Survivor/commit/85553abbca3fc4989da71320cce2a161d9771e80))

## [1.8.1](https://github.com/petrzmax/Circle-Survivor/compare/v1.8.0...v1.8.1) (2026-01-20)


### 🐛 Bug Fixes

* dodge cap ([1060437](https://github.com/petrzmax/Circle-Survivor/commit/106043784581fee7b1f4c388edf638c54d8604af))

## [1.8.0](https://github.com/petrzmax/Circle-Survivor/compare/v1.7.4...v1.8.0) (2026-01-20)


### ✨ Features

* integrate react-hot-toast for notifications and error handling ([a05fe55](https://github.com/petrzmax/Circle-Survivor/commit/a05fe5571073ba5ce4a9113eab8883d032dd97f2))
* weapon selling functionality ([c03be00](https://github.com/petrzmax/Circle-Survivor/commit/c03be008509cb464080e98de7b43ea33fc59c3bc))


### 🐛 Bug Fixes

* correct XP calculation by applying multiplier ([41cf3b2](https://github.com/petrzmax/Circle-Survivor/commit/41cf3b2b46993ef43474c5f5a399d1ccd9570612))
* ensure character emoji is always returned correctly ([d71922c](https://github.com/petrzmax/Circle-Survivor/commit/d71922c8bf9364bbeb73d7c84f615a4495eb0c01))
* handling and saving character data ([45961e4](https://github.com/petrzmax/Circle-Survivor/commit/45961e4225ece48e872d75e59c5174f9758d5a4b))
* leaderboard character handling ([092c0a2](https://github.com/petrzmax/Circle-Survivor/commit/092c0a2d51fcc7e0d66ef400321047d34c9fdbda))
* shop item display logic ([f79f4bb](https://github.com/petrzmax/Circle-Survivor/commit/f79f4bb7df1cacd8ff5b48b07a348d2b032797e0))


### 📦 Other Changes

* **ci:** auto merge sync pr ([60fda22](https://github.com/petrzmax/Circle-Survivor/commit/60fda226f55883725b627b2705eab0ef8b74aa50))
* **ci:** simplify release workflow ([2e5ad67](https://github.com/petrzmax/Circle-Survivor/commit/2e5ad675df82655650aea701af3f31a11dc992dd))
* **ci:** update permissions to include actions write access ([d9d3447](https://github.com/petrzmax/Circle-Survivor/commit/d9d3447738a7742c369fc654309f2b1e7eaea17c))
* **ci:** update pull request branches for CI workflow ([96383ba](https://github.com/petrzmax/Circle-Survivor/commit/96383bab724b94b98d3ceb9c4530a83f3073d1b3))
* **deps:** bump @types/node from 25.0.6 to 25.0.9 ([#50](https://github.com/petrzmax/Circle-Survivor/issues/50)) ([7786846](https://github.com/petrzmax/Circle-Survivor/commit/7786846b4268085e79589acc8772828a5249b5b4))
* **deps:** bump @typescript-eslint/eslint-plugin from 8.52.0 to 8.53.0 ([#52](https://github.com/petrzmax/Circle-Survivor/issues/52)) ([a40d727](https://github.com/petrzmax/Circle-Survivor/commit/a40d727ef40408fbbe595eb5227f623ac86f8f60))
* **deps:** bump @vitest/ui from 4.0.16 to 4.0.17 ([#51](https://github.com/petrzmax/Circle-Survivor/issues/51)) ([0e1e0a1](https://github.com/petrzmax/Circle-Survivor/commit/0e1e0a1309ba6ab1a839e29a9a0a22a96c9d78e3))
* **deps:** bump prettier from 3.7.4 to 3.8.0 ([#53](https://github.com/petrzmax/Circle-Survivor/issues/53)) ([8b2345a](https://github.com/petrzmax/Circle-Survivor/commit/8b2345aaa7d458850f47b01df71e617bb3455b1b))
* **deps:** bump typescript-eslint from 8.52.0 to 8.53.0 ([#54](https://github.com/petrzmax/Circle-Survivor/issues/54)) ([3f0ed7b](https://github.com/petrzmax/Circle-Survivor/commit/3f0ed7bd5d45e7e893b54041cdf6863ac47fabd1))
* improve null safety, fix lint warnings ([86047b1](https://github.com/petrzmax/Circle-Survivor/commit/86047b15a948871868472224e53b2ada42fe92d5))

## [1.7.4](https://github.com/petrzmax/Circle-Survivor/compare/v1.7.3...v1.7.4) (2026-01-17)


### 🐛 Bug Fixes

* remove unnecessary label from automated PR creation ([60b118a](https://github.com/petrzmax/Circle-Survivor/commit/60b118a8754b4c91511f655fdf44363a5106fe67))

## [1.7.3](https://github.com/petrzmax/Circle-Survivor/compare/v1.7.2...v1.7.3) (2026-01-17)


### 🐛 Bug Fixes

* add checkout step for repository before creating release PR ([4375ca7](https://github.com/petrzmax/Circle-Survivor/commit/4375ca7dfeb94e2d19b810c9be9c1568f4b033df))

## [1.7.2](https://github.com/petrzmax/Circle-Survivor/compare/v1.7.1...v1.7.2) (2026-01-17)


### 🐛 Bug Fixes

* replace create-pull-request action with gh CLI command for release PR creation ([93dc08a](https://github.com/petrzmax/Circle-Survivor/commit/93dc08acb176f020cc9b585eea578a30c5a8cc14))

## [1.7.1](https://github.com/petrzmax/Circle-Survivor/compare/v1.7.0...v1.7.1) (2026-01-17)


### 🐛 Bug Fixes

* build error ([b001bf3](https://github.com/petrzmax/Circle-Survivor/commit/b001bf3c73745faee8cae677278426c57eab4c56))


### 📦 Other Changes

* **ci:** update CI configuration to run on pull requests to master ([5a67396](https://github.com/petrzmax/Circle-Survivor/commit/5a67396c760109784365c0669efeffaa75a388a5))

## [1.7.0](https://github.com/petrzmax/Circle-Survivor/compare/v1.6.0...v1.7.0) (2026-01-17)


### ✨ Features

* enhance item generation and add inline reroll button with styling ([4d2d738](https://github.com/petrzmax/Circle-Survivor/commit/4d2d7385529b6a47faa0b5dc3ab73af87c5ad947))


### 🐛 Bug Fixes

* game version link ([34c0477](https://github.com/petrzmax/Circle-Survivor/commit/34c047715b17c820592d461ade8742c5469647f1))
* update score submission to use active tab instead of hardcoded value ([a90e20e](https://github.com/petrzmax/Circle-Survivor/commit/a90e20e5bd624559bafba8d5678b9390dd2c3958))


### 📦 Other Changes

* **ci:** update release workflow to create PR for merging develop into master ([109b2e3](https://github.com/petrzmax/Circle-Survivor/commit/109b2e3c3f875f5a905d9deb09e72f70348c1670))

## [1.6.0](https://github.com/petrzmax/Circle-Survivor/compare/v1.5.2...v1.6.0) (2026-01-17)


### ✨ Features

* Add gamepad support ([f103a71](https://github.com/petrzmax/Circle-Survivor/commit/f103a71d3b04846d094cb9480a6ccdda05a198fc))
* adjust enemy bullet radius based on enemy size ([d235a81](https://github.com/petrzmax/Circle-Survivor/commit/d235a81c0322dc566879f65a01be2af4c4a3944a))
* implement StateManager for game state management and refactor related components ([dc1d41e](https://github.com/petrzmax/Circle-Survivor/commit/dc1d41ecfe329d720c124f6e6f99fe75702223bd))
* Migrate to Preact UI components and hooks ([abecee3](https://github.com/petrzmax/Circle-Survivor/commit/abecee3d0891192e1f0989fa64d0f0f0a054b9ad))


### 🐛 Bug Fixes

* gamepad support ([7cf0f89](https://github.com/petrzmax/Circle-Survivor/commit/7cf0f89cca57282faeb447de1b4848e66fb81c18))
* magnet attraction works only when player has magnet ([aafb258](https://github.com/petrzmax/Circle-Survivor/commit/aafb258bea77182d37d0d049bcd01f26f11afc45))


### ♻️ Refactoring

* optimize removal of finished effects using swap-and-pop technique ([0c40bbd](https://github.com/petrzmax/Circle-Survivor/commit/0c40bbdb6a43db802d9f06c09937523b978a2f70))
* remove goldMultiplier from CombatSystem and streamline gold handling in RewardSystem ([a8b2a89](https://github.com/petrzmax/Circle-Survivor/commit/a8b2a8980c2b914913fc60ef20e649188049bad6))
* remove xpAwarded event and handle XP directly in RewardSystem ([bf5c04e](https://github.com/petrzmax/Circle-Survivor/commit/bf5c04e2eb14abe40334e96fe01a847aa8c93997))
* reorganize audio for better concert separation ([93305b8](https://github.com/petrzmax/Circle-Survivor/commit/93305b8153ebadf7bba4dbbf012d7ef1d28e618a))
* reorganize enemy-related code and streamline imports across the project ([982112e](https://github.com/petrzmax/Circle-Survivor/commit/982112ebe86da3a68c8daa5abb6742320abdc495))
* reorganize project structure ([c73cefb](https://github.com/petrzmax/Circle-Survivor/commit/c73cefbd1704e2061b81793a879b808dc633ac79))
* reorganize weapons code ([7c34c69](https://github.com/petrzmax/Circle-Survivor/commit/7c34c698b2ffa71b18b99afd1c02bb8daa21c42d))
* streamline player retrieval and error handling across systems ([b3ecb97](https://github.com/petrzmax/Circle-Survivor/commit/b3ecb979632d749985f1b78364a251b555c40974))
* update visual effect handling across systems and improve event management ([c69f02d](https://github.com/petrzmax/Circle-Survivor/commit/c69f02df2d4dd5c2b818e787d50f56d1b42a2eea))


### 📦 Other Changes

* **deps:** bump @types/node from 25.0.3 to 25.0.6 ([#37](https://github.com/petrzmax/Circle-Survivor/issues/37)) ([485a44f](https://github.com/petrzmax/Circle-Survivor/commit/485a44f0a12459ba7bc72008ac7e00cf19332b35))
* **deps:** bump @typescript-eslint/parser from 8.50.1 to 8.51.0 ([#33](https://github.com/petrzmax/Circle-Survivor/issues/33)) ([2a7da54](https://github.com/petrzmax/Circle-Survivor/commit/2a7da54903d9ab0c063f43ecc3b9fd615373047c))
* **deps:** bump @typescript-eslint/parser from 8.51.0 to 8.52.0 ([#41](https://github.com/petrzmax/Circle-Survivor/issues/41)) ([7e1f791](https://github.com/petrzmax/Circle-Survivor/commit/7e1f7915fe0fbc5ec4a259bf3edef94ff7b71e01))
* **deps:** bump typescript-eslint from 8.50.1 to 8.51.0 ([#34](https://github.com/petrzmax/Circle-Survivor/issues/34)) ([e716689](https://github.com/petrzmax/Circle-Survivor/commit/e71668917f2ff6d19ee4c37628e256e7b546c791))
* **deps:** bump typescript-eslint from 8.51.0 to 8.52.0 ([#38](https://github.com/petrzmax/Circle-Survivor/issues/38)) ([0388608](https://github.com/petrzmax/Circle-Survivor/commit/03886086b66781ce91a0ee7300efbde648b37444))
* **deps:** bump vite from 7.3.0 to 7.3.1 ([#40](https://github.com/petrzmax/Circle-Survivor/issues/40)) ([a483e6b](https://github.com/petrzmax/Circle-Survivor/commit/a483e6bb31c3b02de2eeac41c68f78557de9abe8))
* update .gitignore to include build output and local files ([d4287de](https://github.com/petrzmax/Circle-Survivor/commit/d4287de85464f4fe0b55f85bcb3dc273d2241e5d))
* update package lock ([c28b083](https://github.com/petrzmax/Circle-Survivor/commit/c28b083b6207e861a28087dbca297de46e281fca))

## [1.5.2](https://github.com/petrzmax/Circle-Survivor/compare/v1.5.1...v1.5.2) (2026-01-04)


### 🐛 Bug Fixes

* player sometimes invincible bug ([ce34560](https://github.com/petrzmax/Circle-Survivor/commit/ce34560e11465faf76e11bc774dc1068085507f2))


### ♻️ Refactoring

* extract  pickup spawn logic to spawn system ([aff08ee](https://github.com/petrzmax/Circle-Survivor/commit/aff08eeae222c5cc91d51971fd0e962e527088d8))
* extract reward logic to reward system ([80bf969](https://github.com/petrzmax/Circle-Survivor/commit/80bf969ab44959026c8042dad4102f6db33b2e37))
* move pickup creation to pickup factory ([09b2024](https://github.com/petrzmax/Circle-Survivor/commit/09b20246b5bb6632e69e560dd9f56cc69f2f493b))

## [1.5.1](https://github.com/petrzmax/Circle-Survivor/compare/v1.5.0...v1.5.1) (2026-01-04)


### ⚖️ Balance Changes

* faster per wave roll price scaling ([7e0482a](https://github.com/petrzmax/Circle-Survivor/commit/7e0482addb497fac49b1fe15f17f15d9a635bb13))
* revert enemie bullet speed ([0b38559](https://github.com/petrzmax/Circle-Survivor/commit/0b38559e5e71155a4b37dda81a90300cde851367))


### 🐛 Bug Fixes

* invisible player loop ([f044fc0](https://github.com/petrzmax/Circle-Survivor/commit/f044fc003ac72d77ae7da383880057c0366795f4))
* shop disables mostly available items ([2d858fe](https://github.com/petrzmax/Circle-Survivor/commit/2d858feb890802cf80bfd21b579b380aed286c4e))

## [1.5.0](https://github.com/petrzmax/Circle-Survivor/compare/v1.4.4...v1.5.0) (2026-01-03)


### ✨ Features

* new boss attack patterns - double, around ([9d32110](https://github.com/petrzmax/Circle-Survivor/commit/9d3211009a0ee7fad487de89bf94c92337f365b6))
* new boss name ([dc618d6](https://github.com/petrzmax/Circle-Survivor/commit/dc618d6c4d17968e24fdb7e78926d4b0e4ebc90b))


### ⚖️ Balance Changes

* **balance:** reduce baseball item knockback ([299ac5a](https://github.com/petrzmax/Circle-Survivor/commit/299ac5ae3a3a01a944a532fa82720d12f7e0d072))
* **balance:** simplify prices scaling ([20405bb](https://github.com/petrzmax/Circle-Survivor/commit/20405bbd1ce0bec89f2daf97ec66fff633867448))
* **balance:** update boss bullet speed ([9aef4f0](https://github.com/petrzmax/Circle-Survivor/commit/9aef4f008207eafb4a07d3cdcc6eca3246336daf))


### 🐛 Bug Fixes

* exploader explosion affects player ([62f9927](https://github.com/petrzmax/Circle-Survivor/commit/62f9927da8966937c2c9f36b8feb3e53f520a25e))
* shop compile error ([0583422](https://github.com/petrzmax/Circle-Survivor/commit/05834222d9b20eeb5d7646b5521cf157163e15e1))


### 📦 Other Changes

* add cooldown properties to sound definitions to prevent sound lag & overload ([7df6818](https://github.com/petrzmax/Circle-Survivor/commit/7df6818be4e266e5a7eee13aa478c0ba40d09917))
