# LLM-TextQuest Content Safety & Moderation Spec

## Назначение документа

Этот документ описывает правила content safety и moderation для MVP `LLM-TextQuest`.

Его задача — зафиксировать:

- какой контент допускается в продукте;
- какой контент запрещен или должен ограничиваться;
- что фильтруется во вводе пользователя;
- что фильтруется в AI-generated output;
- как обрабатываются жалобы и инциденты;
- какие минимальные инструменты нужны команде и админке.

Связанные документы:

- [LLM-TextQuest-MVP.md](D:\pro\LMQuest\LLM-TextQuest-MVP.md)
- [LLM-TextQuest-Game-Rules-Spec.md](D:\pro\LMQuest\LLM-TextQuest-Game-Rules-Spec.md)
- [LLM-TextQuest-Turn-Contract.md](D:\pro\LMQuest\LLM-TextQuest-Turn-Contract.md)
- [LLM-TextQuest-MVP-Monitoring.md](D:\pro\LMQuest\LLM-TextQuest-MVP-Monitoring.md)
- [LLM-TextQuest-Admin-Console-Spec.md](D:\pro\LMQuest\LLM-TextQuest-Admin-Console-Spec.md)
- [LLM-TextQuest-MVP-Launch-Checklist.md](D:\pro\LMQuest\LLM-TextQuest-MVP-Launch-Checklist.md)

---

## 1. Принципы safety для MVP

Content safety в MVP строится по следующим принципам:

1. Безопасность важнее "полной творческой свободы".
2. Фильтрация должна происходить и на пользовательском вводе, и на AI output.
3. Система не должна быть хрупкой: отказ в unsafe-запросе не должен ломать сессию.
4. MVP допускает ограниченный объем ручной модерации, но не может зависеть только от нее.
5. Правила должны быть достаточно простыми, чтобы их можно было реально поддерживать.

Следствие:

- в MVP нужен базовый policy layer;
- нужен automated moderation pipeline;
- нужен ручной fallback через админку;
- unsafe output не должен попадать игроку без проверки.

---

## 2. Области, которые нужно модерировать

Для MVP модерируются 4 типа контента:

1. Ввод пользователя при создании мира.
2. Ввод пользователя при создании персонажа.
3. Свободный ввод игрока во время хода.
4. Ответы LLM:
   - миры
   - персонажи
   - сцены
   - результаты действий
   - варианты действий

Дополнительно в MVP желательно иметь возможность модерировать:

- display name пользователя;
- пользовательские архетипы / названия сущностей;
- публичные миры.

---

## 3. Базовая policy-модель

### 3.1 Разрешенный контент

В MVP допускаются:

- фэнтези, sci-fi, приключения, детектив, мистика;
- умеренное сюжетное насилие без натуралистических подробностей;
- конфликт, опасность, угрозы, бой как часть игры;
- мрачный тон, если он не переходит в запрещенные категории;
- морально сложные сюжетные ситуации без явного запрещенного контента.

### 3.2 Ограниченно допустимый контент

В MVP допустим, но должен смягчаться:

- насилие без избыточной графичности;
- хоррор без откровенного шок-контента;
- психологическое давление без романтизации вреда;
- религиозные/политические мотивы как часть сеттинга, если они не превращаются в hate content;
- преступные мотивы в fiction-контексте без инструктивности.

### 3.3 Запрещенный контент

В MVP запрещаются:

- сексуальный контент с участием несовершеннолетних;
- эротический/порнографический explicit sexual content;
- sexual exploitation;
- extreme gore и графическое описание расчленения/пыток;
- подробные self-harm / suicide instructions или романтизация саморазрушения;
- hate speech и дегуманизация защищаемых групп;
- целевые угрозы реальным людям;
- doxxing / публикация персональных данных;
- инструкции по созданию оружия, взрывчатки, обходу безопасности и иной явной harmful activity;
- откровенно экстремистская пропаганда;
- контент, нарушающий базовые правила платформы и закона.

### 3.4 Что особенно важно для narrative-игры

Для `LLM-TextQuest` отдельно важно запрещать:

- "эротическую RPG" как use case MVP;
- fetishized violence;
- roleplay, ориентированный на abuse, rape, coercion как основную цель;
- explicit сексуальные сцены в generated output;
- шок-контент ради шок-контента.

---

## 4. Возрастной и тональный baseline

### 4.1 Рекомендуемый baseline для MVP

Безопаснее всего запускать MVP как:

- `Teen / 16+ tone`
- без explicit sexual content
- без extreme gore

### 4.2 Что это значит practically

Это значит:

- бой и риск допустимы;
- персонажи могут быть ранены, схвачены, побеждены;
- мрачные темы допустимы;
- но narration должен избегать натуралистической жестокости и сексуальной explicitness.

Это хороший баланс между RPG-ставками и manageable moderation scope.

---

## 5. Moderation pipeline

### 5.1 Общий pipeline

Для MVP рекомендуется такой pipeline:

1. Пользователь отправляет ввод.
2. Backend запускает moderation check для input.
3. Если input unsafe:
   - запрос блокируется;
   - пользователь получает безопасное объяснение;
   - сессия не ломается.
4. Если input safe:
   - происходит normalizer / gameplay / generation pipeline.
5. После AI generation backend запускает moderation check для output.
6. Если output unsafe:
   - ответ не отдается пользователю напрямую;
   - выполняется retry с более жесткой инструкцией или fallback-template;
   - инцидент логируется.

### 5.2 Почему нужен double moderation

Если модерировать только input:

- unsafe output все равно может появиться из-за модели.

Если модерировать только output:

- unsafe user intent уже пройдет слишком далеко внутрь pipeline и будет дороже по cost.

Поэтому нужны оба слоя.

### 5.3 Архитектурное решение для автоматической модерации

В MVP автоматическую модерацию должен выполнять **backend moderation pipeline**, а не narrative-модель и не клиент.

Рекомендуемое архитектурное решение:

- простой backend prefilter для очевидных запрещенных паттернов и abuse;
- отдельный moderation-check для `user input`;
- отдельный moderation-check для `AI output`;
- orchestration этого процесса на backend до и после AI generation.

Основной инструмент автоматической модерации для MVP:

- **OpenAI Moderation API (`omni-moderation-latest`)**

Причины выбора:

- это специализированный moderation endpoint;
- он хорошо подходит именно для policy-check, а не для narrative generation;
- он может использоваться независимо от того, какой провайдер генерирует основной контент;
- его удобно встраивать как единый safety layer для mixed-model architecture.

Дополнительный слой защиты:

- если narrative generation выполняется через `Gemini`, включаются его встроенные safety settings;
- provider-level safety у других моделей может использоваться как дополнительная защита;
- но источником истины для moderation decision в MVP должен оставаться backend moderation layer.

Следствие:

- можно генерировать контент через `OpenAI`, `Gemini`, `Claude`, `Qwen` или другой провайдер;
- но решение `ALLOW / BLOCK / FALLBACK` должно приниматься единообразно через backend moderation pipeline;
- moderation logic не должна зависеть от одной narrative-модели.

---

## 6. Модерация пользовательского ввода

### 6.1 Где проверять

Moderation input check нужен минимум для:

- `POST /worlds`
- `POST /characters`
- `POST /sessions/:sessionId/turns` при `FREE` вводе
- display name / публичные названия

### 6.2 Возможные результаты input moderation

- `ALLOW`
- `ALLOW_WITH_SOFT_WARNING`
- `BLOCK`
- `ESCALATE`

### 6.3 Поведение при `BLOCK`

Если input блокируется:

- backend не запускает AI generation;
- пользователь получает нейтральное объяснение;
- сессия сохраняет целостность;
- в логах фиксируется moderation result без необходимости хранить лишний raw text в observability-слое.

### 6.4 Пример пользовательского ответа

Например:

- "Этот запрос не поддерживается правилами игры. Попробуйте другой вариант действия."

Важно:

- не спорить с пользователем;
- не выдавать слишком точные формулировки bypass-инструкций;
- не раскрывать policy в exploitable виде.

---

## 7. Модерация AI output

### 7.1 Что проверять

Проверять нужно:

- generated world description;
- generated character backstory;
- `resultText`;
- `sceneText`;
- `choices`;
- summaries;
- названия world/character/NPC, если они генерируются.

### 7.2 Возможные действия при unsafe output

Если output unsafe:

- выполнить один retry с более строгим safe prompt;
- если retry тоже unsafe — отдать fallback-safe response;
- записать событие в лог moderation / AI incident log.

### 7.3 Fallback-safe response

Для MVP полезно иметь готовый fallback-паттерн:

- более нейтральный narrative;
- без explicit деталей;
- с сохранением логики сцены;
- без попытки "дожать" unsafe запрос.

Например:

- "Ситуация становится напряженной, но повествование смещается к последствиям, а не к графическим деталям."

---

## 8. Особые категории риска

### 8.1 Self-harm / suicide

В MVP:

- не допускаются инструкции;
- не допускается романтизация;
- не допускаются детальные описания как core fantasy.

Если такая тема всплывает:

- output должен деэскалироваться;
- сцена должна переводиться в безопасный narrative;
- при необходимости сессия может быть мягко отклонена от этой линии.

### 8.2 Sexual content

В MVP:

- explicit sexual content запрещен;
- erotic roleplay запрещен;
- сексуализированное насилие запрещено.

Допустимы только:

- намеки на романтические отношения;
- неявный off-screen романтический контекст без explicit details.

### 8.3 Hate / harassment

В MVP запрещены:

- оскорбления и дегуманизация защищаемых групп;
- roleplay, направленный на травлю реальных людей;
- прямые призывы к насилию против групп.

### 8.4 Illegal / dangerous instructions

Запрещены:

- пошаговые инструкции по вредоносной деятельности;
- попытки использовать игру как оболочку для harmful-how-to контента;
- guidance по обходу безопасности, изготовлению оружия и т.п.

### 8.5 Minors

Любые сексуальные или эксплуатационные сценарии с участием несовершеннолетних полностью запрещены.

---

## 9. Контент публичных миров

### 9.1 Почему это отдельная зона

Публичные миры — это уже не только private gameplay, но и UGC surface.

### 9.2 Минимальные правила для публичного мира

Публичный мир не должен:

- иметь явный unsafe title;
- быть ориентирован на explicit sexual content;
- быть ориентирован на hate / extremist / abuse themes;
- иметь заведомо unsafe стартовый prompt.

### 9.3 MVP-подход

Для MVP разумно:

- модерировать публичные миры строже, чем приватные;
- иметь возможность быстро перевести проблемный мир в `PRIVATE` или `ARCHIVED`;
- иметь ручной admin action на отключение мира.

---

## 10. Жалобы и ручная модерация

### 10.1 Нужен ли репортинг в MVP

Да, хотя бы в минимальном виде.

### 10.2 Что желательно поддержать

Минимально:

- report world
- report generated content
- report user profile / name

### 10.3 Что делать с жалобой

Для MVP достаточно простого workflow:

1. Жалоба сохраняется.
2. Support/Ops видит ее в админке или очереди.
3. Контент проверяется вручную.
4. При необходимости:
   - мир архивируется;
   - пользователь предупреждается или блокируется;
   - контент скрывается.

### 10.4 Что можно не делать в MVP

Не обязательно сразу строить:

- сложную очередь модерации;
- SLA-машину;
- автоматическую приоритизацию кейсов;
- многоуровневый appeals process.

---

## 11. Enforcement actions

Для MVP достаточно следующих действий:

- `allow`
- `soft block`
- `hard block`
- `force fallback`
- `archive world`
- `hide content from public surface`
- `temporary user block`

### 11.1 Когда применять soft block

Когда:

- запрос unsafe для продукта, но не выглядит злонамеренным;
- пользователь, скорее всего, просто тестирует границы.

### 11.2 Когда применять hard block

Когда:

- есть повторный явный abuse;
- есть запрещенные категории высокого риска;
- есть признаки систематического обхода ограничений.

---

## 12. Логирование и аудит moderation

### 12.1 Что нужно логировать

Для каждого moderation decision полезно хранить:

- `feature`
- `surface`
- `userId`
- `sessionId` при наличии
- `worldId` / `characterId` при наличии
- `input_or_output`
- moderation result
- enforcement action
- модель/сервис moderation
- timestamp

### 12.2 Что не стоит логировать без нужды

Не стоит:

- дублировать полный raw user text в observability-логах;
- разносить unsafe content по множеству сервисов;
- хранить лишний sensitive content дольше, чем нужно для support/moderation.

---

## 13. Monitoring и алерты по safety

### 13.1 Что мониторить

- input moderation block rate
- output moderation block rate
- retry-after-moderation rate
- fallback-safe response rate
- report rate
- archived worlds count
- user block rate
- repeated offender rate

### 13.2 Тревожные сигналы

Особенно важны:

- резкий рост unsafe output rate;
- резкий рост blocked free-form input;
- всплеск жалоб по одному типу контента;
- рост fallback-safe response rate;
- резкий рост manual moderation load.

Это может означать:

- деградацию модели;
- неудачный prompt change;
- abuse wave;
- слишком слабую pre-filtering стратегию.

---

## 14. Связь с админкой

### 14.1 Что должно быть видно в админке

Для MVP в админке должно быть видно:

- moderation block history пользователя;
- report history;
- unsafe world flags;
- flagged sessions / turns;
- ручные enforcement actions.

### 14.2 Что админ должен уметь

Минимально:

- просмотреть flagged world;
- перевести world в `PRIVATE` или `ARCHIVED`;
- вручную заблокировать пользователя;
- снять блокировку;
- посмотреть repeated violations;
- оставить note по кейсу.

---

## 15. Что можно отложить

На MVP можно отложить:

- ML-классификацию собственного обучения;
- сложную trust & safety команду;
- auto-ban scoring system;
- репутационную систему пользователей;
- глубокую age verification;
- многоуровневый appeals flow.

---

## 16. Минимальный launch-ready baseline

Перед запуском MVP должно быть готово минимум следующее:

- input moderation для worlds / characters / free-form turns;
- output moderation для generated scenes;
- fallback-safe response;
- базовые report actions;
- admin action на archive / block;
- monitoring unsafe rates;
- policy текст для support и internal команды.

---

## 17. Главный вывод

Для `LLM-TextQuest` content safety — это не дополнительная опция, а обязательная часть MVP.

Главная цель MVP-safety:

- не дать продукту превратиться в unsafe roleplay surface;
- не ломать игровой pipeline при unsafe запросах;
- держать moderation scope достаточно узким, чтобы команда реально могла им управлять.

Самый практичный baseline для запуска:

- `Teen / 16+ tone`
- без explicit sexual content
- без extreme gore
- без harmful instructions
- с double moderation: `input + output`
