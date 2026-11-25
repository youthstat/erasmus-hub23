# Erasmus+ Hub

## Запуск
1. `npm install`
2. Створіть проєкт на https://console.firebase.google.com
   - Build → Firestore Database → Create database
   - Build → Authentication → Sign-in method → увімкніть **Anonymous**
   - Project settings → Your apps → Web (</>) → скопіюйте ключі
3. Ключі Firebase вже вписані в `src/firebase/config.js` (файл .env не потрібен)
4. Firestore → Rules → вставте вміст `firestore.rules` → Publish
5. `npm run dev`
6. На сайті: ADMIN → пароль `1234` → Admin panel → "Load demo missions" (або створіть свої)

Пароль адміна: `src/config/adminPassword.js`.

## Колекції Firestore
- `users/{id}`: name, country, score, registered (учасників додає адмін)
- `credentials/{userId}`: passHash (пароль акаунта учасника, SHA-256)
- `missions/{id}`: title, category, points, short, details, proofType (link/comment/confirm), proofHint, deadlineAt, recurrence, active
- `submissions/{uid_missionId_date}`: missionId, userId, userName, points, proofType, proofValue, status (pending/approved/rejected)
- `gossips/{hash}`: госіп для Rattie Patty (text, words, points, createdAt + anonymous; userId/userName лише якщо відправник обрав «Show my name»). Читає лише адмін-сторінка; id — хеш (людина + текст), тому той самий текст від тієї ж людини вдруге не оплачується
- `pointsLog/{id}`: userId, delta, reason, createdAt
- `sfPlayers/{userId}`, `sfClaims/{targetId}` — Secret friend (хто кому секрет-френд)
- `kgPlayers/{userId}`, `kgClaims/{targetId}`, `kgItemClaims/{ownerId}` — Killer game (жертва + предмет)

## Акаунти учасників
Адмін додає учасників (leaderboard → + ADD PARTICIPANT). Учасник: Sign in / Register → обирає своє ім'я зі списку
(можна друкувати для пошуку), вказує країну й придумує пароль → потрапляє у свій акаунт. Далі вхід за ім'ям і паролем.
Забули пароль: Admin → leaderboard → RESET PW (ім'я знову вільне, бали зберігаються).

## Секрет-френд і Killer game
Грає той, хто зайшов в акаунт: ім'я підставляється автоматично, пароль не потрібен. В Killer game учасник вказує лише предмет.
Ніхто не отримує себе, кожне ім'я видається лише раз, усі зв'язки утворюють один замкнений ланцюжок.
Адмін у Admin panel: додає/редагує/видаляє учасників (країна, бали), вибирає хто грає в кожну гру, бачить усі зв'язки,
може вилучити гравця (ELIMINATE) і скинути гру (RESET GAME).
Killer game: кнопка «I killed my victim» вбиває жертву (викреслюється на дошці, у неї «You have been killed»),
вбивця успадковує її жертву й предмет.
Додаткова колекція: `gameConfig/{sf|kg}` -> { excluded: [userId] }.

## Безпека
Пароль 1234 перевіряється в браузері, тому технічно тямущий користувач зможе обійти його.
Для події серед знайомих це нормально. Для суворого захисту: Firebase Auth (email адміна)
+ правила `request.auth.token.email == '...'` для запису балів/місій.

## Rattie Patty (mascot)
`src/components/mascot/Mascot.jsx` — маленька сіра мишка з рожевими вухами живе на сторінці: лазить по блоках (`.box` і картках), спить на них, гризе кут, ховається за краєм блока та визирає з краю екрана, іноді каже «Don't click me!». Спрайти — `src/assets/mouse/` (вирізані зі стікерлиста), список — `sprites.js`.

Клік по ній: «Hi, I'm Rattie Patty!» → пропозиція «gossip for 1 point — deal?» → **Deal!** → поле, де вона чекає на текст. Кожен госіп довший за 3 слова (4+) = **+1 бал** одразу після «Send»; писати можна скільки завгодно, але кожен госіп має бути новим. Без акаунта вона просить зареєструватись, з акаунтом вітає на ім'я. Відправник обирає «Anonymous» (автор не зберігається взагалі) або «Show my name» (ім'я бачить лише адмін). Інші учасники госіпів не бачать; в адмін-панелі є блок «Gossips for Rattie Patty». Вікно мишки — «сирне» (клас `.cheese` в `index.css`). Налаштування (бали, мінімум слів) — константи `GOSSIP_POINTS`, `GOSSIP_MIN_WORDS` у `src/firebase/services.js`.


## Нове (адмін)
- Адмін-панель: кожен блок можна сховати (HIDE) або відкрити на весь екран (FULL WINDOW, Esc закриває); HIDE ALL / SHOW ALL.
- Місії: CLEAR DONE на картці місії та Clear all completions — очищає всіх, хто виконав (бали, що вже нараховані, лишаються).
- Gossips: видалення по одному (з підтвердженням) і Gossip board `/gossips` — режим читання лише з паролем, який ставить адмін
  (Admin → Gossips → Set a password → Open for readers). Автори читачам не показуються. Документ: `settings/gossips`.
- Oscar: при «Send to voting» додається обкладинка фільму (стискається в JPEG і зберігається в `teams/{id}.cover`).
  У бюлетені зверху картинка + назва фільму, нижче ім'я людини і фільм, який вона представляє.
- Години прибрано: етапи Oscar без часу, дедлайн місії — лише дата, у формі допомоги немає вибору активності та годин.
- Oscar: приймання команд на голосування (Crew intake) не залежить від статусу голосування; адмін може його закрити/відкрити
  і вказати Expected crews — коли стільки команд відправлено, приймання зупиняється саме. «Clear all votes» видаляє всі бюлетені.
- Головна показує весь рейтинг; у Secret friend після відправки побажань форми більше немає.

## Оновлення v4
- Killer game: предмети змішуються між гравцями й не пов'язані з іменами. Ніхто ніколи не отримує свій предмет
  (раніше це було можливо, якщо вільним лишався тільки свій). Якщо підходящого предмета ще немає — гравець бачить
  підказку зачекати, поки приєднаються інші. По можливості предмет теж не належить жертві. Вбивця також не успадковує свій предмет.
- Oscar: коли адмін відкриває голосування, блок команди ховається від учасників («Time to vote! Who will be the winner?»),
  створювати/редагувати/відправляти команди більше не можна (перевіряється й у транзакціях Firestore).
- Oscar: після «Send to voting» команда заморожена (немає ні Edit crew, ні Change/Withdraw). Лише адмін може повернути її
  на редагування: Admin → Oscar → Crews → «↩ RETURN TO EDITING».
- Бюлетень: компактні картки (менша картинка, текст, відступи; до 4 колонок).

## Оновлення v5
- **Punishment box** (`/punishment`): учасники пишуть панішменти (+1 бал, аркуш складається і летить у коробку), натискають коробку — після великого червоного попередження (−3 бали) вилітає випадковий аркуш і розгортається. Папірці чужі в пріоритеті; кожен береться один раз. Автори видимі лише адміну (Admin → Punishment box: видалити один / повернути в коробку / очистити все).
- **Home screen** (Admin → Home screen): вмикає/вимикає блоки головної (Missions, Ranking, кожна картка). Приховане не бачать учасники, їхня сторінка показує «Not open yet»; адмін бачить усе з позначкою.
- **Gossip board**: форма анонімного госіпа прямо на сторінці (без акаунта, без балів, автор не зберігається) + повідомлення подяки. Читання, як і раніше, лише з паролем адміна.
- Налаштування балів: `PUNISHMENT_COST`, `PUNISHMENT_REWARD` у `src/config/settings.js`.

## Оновлення v5.1
- Gossip board: поки людина читає госіпи, форми «написати/дякуємо» немає. Госіп із дошки тепер теж дає бали (як у Rattie Patty), автор не зберігається; на формі показано «+1 PT for every gossip».
- Доступ до читання за паролем діє лише в відкритій сторінці: нове відкриття сторінки / вхід іншого акаунта / зміна пароля = пароль знову. Він ніде не зберігається (ні в браузері, ні в акаунті).
- Punishment box: не більше 5 написаних панішментів на людину на день (`PUNISHMENT_DAILY_LIMIT`), лічильник «Written today: N of 5».

## Виправлення v5.2
- Oscar: зміна типу питання (особа ↔ фільм/весь каст) після того, як команди вже відправили номінації, більше не ламає сторінку (`.filter is not a function`). Старі номінації читаються в обох типах: список людей для «film» = команда номінована; «весь фільм» для «person» = весь склад команди.

## Оновлення v5.3
- **Killer game:** «I killed my victim» відкриває коротку форму «How did it go?» (настрій: easy / tricky / super hard / hilarious + 1–2 речення про найскладніший чи найвеселіший момент). Кнопки: «Confirm the kill» (потрібен текст) або «🤫 Keep it secret» (без коментаря). Лише після цього жертву вбито і з'являється наступна. Історії показуються на дошці «How it happened» без імені мисливця; адмін бачить їх у таблиці гри (або «story kept secret»). Revive очищає історію.
- **Secret friend — чати:** секретний друг може надіслати до 3 питань на день тому, кому дарує (`SF_DAILY_QUESTIONS`). Питання анонімні. Людина може відповісти або мовчати. Два екрани: «Chat with <ім'я>» (мої питання й відповіді, бульбашки) та «Chat from your secret friend» (питання до мене з полем відповіді), плюс правила чату. Дані: `sfQuestions`, `sfDaily`; скидаються кнопкою Reset гри.

## Оновлення v5.4 — Secret friend: профілі й досьє
- Побажання більше не вводяться при вході в гру. Усе в профілі, і все **необов'язкове** (також фото).
- `/secret-friend/buddy` — досьє твого секрет френда: фото, ім'я, країна, 4 розділи (напої/снеки, хобі, вішліст, алергії), чат з ним і правила чату. Кнопка «Learn more about your secret friend» на головній сторінці гри.
- `/secret-friend/my-profile` — твій профіль для твого секрет френда (фото, 4 поля, збереження), вхідні питання від секрет френда з відповідями, чекліст.
- **+50 балів** (`SF_PROFILE_BONUS`) одноразово, коли всі 4 текстові поля заповнені (≥15 символів кожне, `SF_PROFILE_MIN`). Підказка «Fill in your profile — get +50 points» на головній, у профілі й у кнопках.
- Дані: `sfPlayers/{id}.profile` (+ `profileBonus`). Старі «likes/dislikes» показуються як «Earlier wishes».

## Copyright
Copyright © 2026 Diana Demianets. All rights reserved. See the `LICENSE` file. The notice is in the footer of every page, the full text is at `/copyright`, and it is also in `index.html` (meta author/copyright), in the built JS (`/*! … */` comment) and in `package.json` (`"license": "UNLICENSED"`). Contact: demianets20@gmail.com
