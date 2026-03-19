# LLM-TextQuest Data Model Spec

## Назначение документа

Этот документ описывает минимальную модель данных для MVP `LLM-TextQuest`.

Его задача — перевести продуктовые решения, rules spec, turn contract, экономику и мониторинг в конкретные сущности, поля, статусы и связи, на основе которых можно проектировать `Prisma schema`, backend API и storage strategy.

Связанные документы:

- [LLM-TextQuest-MVP.md](D:\pro\LMQuest\LLM-TextQuest-MVP.md)
- [LLM-TextQuest-Game-Rules-Spec.md](D:\pro\LMQuest\LLM-TextQuest-Game-Rules-Spec.md)
- [LLM-TextQuest-Turn-Contract.md](D:\pro\LMQuest\LLM-TextQuest-Turn-Contract.md)
- [LLM-TextQuest-MVP-Economics.md](D:\pro\LMQuest\LLM-TextQuest-MVP-Economics.md)
- [LLM-TextQuest-MVP-Monitoring.md](D:\pro\LMQuest\LLM-TextQuest-MVP-Monitoring.md)
- [LLM-TextQuest-MVP-Launch-Checklist.md](D:\pro\LMQuest\LLM-TextQuest-MVP-Launch-Checklist.md)

---

## 1. Принципы моделирования

Модель данных MVP строится по следующим правилам:

1. Сущности должны покрывать только MVP-сценарий.
2. Одиночная сессия моделируется проще, чем будущий мультиплеер.
3. Формальные поля правил хранятся структурно, а не только текстом.
4. Narrative-данные и gameplay-данные должны быть различимы.
5. Hidden caps и usage tracking должны быть видны на уровне данных.
6. Хранилище должно поддерживать recovery, monitoring и billing edge cases.

Следствие:

- в MVP персонаж привязан к одному миру;
- одна активная сессия допускается только на одного персонажа;
- `GameEvent` хранит и narrative, и системный результат;
- AI usage логируется отдельно;
- подписка и entitlements хранятся отдельно от gameplay-сущностей.

---

## 2. Технологические допущения

Рекомендуемые базовые типы:

- идентификаторы: `uuid`
- временные поля: `timestamptz`
- перечисления: `enum`
- краткий текст: `text` или `varchar`
- структурированные поля: `jsonb`
- счетчики: `integer`
- денежные значения: `numeric(12, 4)` или эквивалент

Базовая БД:

- `PostgreSQL`

Операционное состояние и session locks:

- `PostgreSQL`

Важно:

- в MVP `PostgreSQL` является единственным источником истины и для данных, и для short-lived operational state;
- session lock, `processingStartedAt`, текущая сцена, choices и usage counters должны храниться в основной БД и переживать рестарт приложения.

---

## 3. Основные перечисления

### 3.1 Пользователь и биллинг

`user_plan`

- `FREE`
- `PREMIUM`

`subscription_status`

- `INACTIVE`
- `ACTIVE`
- `PAST_DUE`
- `CANCELED`
- `EXPIRED`
- `INCOMPLETE`

`billing_provider`

- `STRIPE`

### 3.2 Мир и контент

`world_visibility`

- `PUBLIC`
- `PRIVATE`

`world_status`

- `DRAFT`
- `READY`
- `FAILED`
- `ARCHIVED`

`world_death_mode`

- `NORMAL`

### 3.3 Персонаж

`character_status`

- `ACTIVE`
- `DOWNED`
- `ARCHIVED`

`character_stat`

- `PHYSICAL`
- `MENTAL`
- `SOCIAL`

### 3.4 Сессия и ход

`session_status`

- `IDLE`
- `PROCESSING_TURN`
- `ERROR`
- `FINISHED`
- `ABANDONED`

`danger_level`

- `SAFE`
- `RISKY`
- `DANGER`

`input_type`

- `PRESET`
- `FREE`

`turn_execution_status`

- `RECEIVED`
- `NORMALIZED`
- `RULES_RESOLVED`
- `NARRATIVE_GENERATED`
- `VALIDATED`
- `SAVED`
- `FAILED`

### 3.5 Rules engine

`action_category`

- `EXPLORATION`
- `SOCIAL`
- `PHYSICAL_RISK`
- `ITEM_OR_SITUATION`

`resolution_mode`

- `AUTO_SUCCESS`
- `CHECK`
- `AUTO_FAIL`

`roll_mode`

- `NONE`
- `NORMAL`
- `ADVANTAGE`
- `DISADVANTAGE`

`outcome_type`

- `SUCCESS`
- `PARTIAL_SUCCESS`
- `FAILURE`

`outcome_severity`

- `NORMAL`
- `CRITICAL_SUCCESS`
- `CRITICAL_FAILURE`

`consequence_type`

- `NONE`
- `TIME_LOSS`
- `POSITION_LOSS`
- `THREAT_UP`
- `RESOURCE_SPENT`
- `RESOURCE_DAMAGED`
- `NPC_ATTITUDE_DOWN`
- `PATH_BLOCKED`
- `SCENE_DEFEAT`
- `HP_DAMAGE`

### 3.6 AI and observability

`ai_feature`

- `INPUT_NORMALIZER`
- `NARRATIVE_TURN`
- `WORLD_GENERATION`
- `CHARACTER_GENERATION`
- `SUMMARY_GENERATION`

`ai_request_status`

- `SUCCESS`
- `FAILED`
- `FALLBACK`

---

## 4. Список основных сущностей

MVP-модель данных включает следующие ключевые сущности:

- `User`
- `UserSubscription`
- `BillingEvent`
- `UserUsagePeriod`
- `WorldTemplate`
- `World`
- `Character`
- `AdventureSession`
- `TurnExecution`
- `GameEvent`
- `AiRequestLog`

Auth-provider-specific служебные таблицы (`Account`, `Session`, `VerificationToken` для Auth.js/NextAuth) считаются инфраструктурными и в этом документе подробно не расписываются.

---

## 5. User

### 5.1 Назначение

Хранит основную запись пользователя и кешируемые поля доступа.

### 5.2 Поля

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | `uuid` | да | PK |
| `email` | `text` | да | уникальный email |
| `displayName` | `text` | нет | имя пользователя |
| `plan` | `user_plan` | да | текущий эффективный план |
| `planSource` | `text` | нет | `default`, `stripe`, `admin` и т.п. |
| `isEmailVerified` | `boolean` | да | подтвержден ли email |
| `isBlocked` | `boolean` | да | блокировка доступа |
| `lastSeenAt` | `timestamptz` | нет | последний визит |
| `createdAt` | `timestamptz` | да | дата создания |
| `updatedAt` | `timestamptz` | да | дата обновления |

### 5.3 Комментарий

`plan` можно считать denormalized/cached полем, вычисляемым из подписки и административных override-ов.

---

## 6. UserSubscription

### 6.1 Назначение

Хранит подписку пользователя на платный тариф.

### 6.2 Поля

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | `uuid` | да | PK |
| `userId` | `uuid` | да | FK -> `User.id` |
| `provider` | `billing_provider` | да | сейчас `STRIPE` |
| `providerCustomerId` | `text` | нет | customer id у провайдера |
| `providerSubscriptionId` | `text` | нет | subscription id у провайдера |
| `status` | `subscription_status` | да | состояние подписки |
| `planCode` | `text` | да | например `premium_monthly` |
| `currentPeriodStart` | `timestamptz` | нет | начало оплаченного периода |
| `currentPeriodEnd` | `timestamptz` | нет | конец оплаченного периода |
| `cancelAtPeriodEnd` | `boolean` | да | флаг отмены по концу периода |
| `canceledAt` | `timestamptz` | нет | момент отмены |
| `endedAt` | `timestamptz` | нет | фактическое завершение |
| `createdAt` | `timestamptz` | да | дата создания |
| `updatedAt` | `timestamptz` | да | дата обновления |

### 6.3 Комментарий

Для MVP допустима одна активная подписка на пользователя, но историю отмененных и прошлых подписок лучше сохранять.

---

## 7. BillingEvent

### 7.1 Назначение

Хранит входящие billing/webhook события и обеспечивает их идемпотентную обработку.

### 7.2 Поля

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | `uuid` | да | PK |
| `provider` | `billing_provider` | да | источник |
| `providerEventId` | `text` | да | уникальный id события |
| `eventType` | `text` | да | тип события |
| `payload` | `jsonb` | да | сырое тело события |
| `status` | `text` | да | `received`, `processed`, `failed` |
| `processedAt` | `timestamptz` | нет | когда обработали |
| `errorCode` | `text` | нет | код ошибки |
| `createdAt` | `timestamptz` | да | дата получения |

### 7.3 Комментарий

Эта сущность особенно важна для запуска, потому что billing edge cases без журнала вебхуков очень трудно разбирать.

---

## 8. UserUsagePeriod

### 8.1 Назначение

Хранит usage по пользователю за расчетный период, главным образом для hidden caps и экономики.

### 8.2 Поля

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | `uuid` | да | PK |
| `userId` | `uuid` | да | FK -> `User.id` |
| `periodStart` | `timestamptz` | да | начало периода |
| `periodEnd` | `timestamptz` | да | конец периода |
| `effectivePlan` | `user_plan` | да | план в периоде |
| `turnCount` | `integer` | да | число игровых сообщений/ходов |
| `worldCreationCount` | `integer` | да | число созданных миров в периоде |
| `characterCreationCount` | `integer` | да | число созданных персонажей в периоде |
| `normalizerCostUsd` | `numeric` | да | накопленная стоимость normalizer |
| `narrativeCostUsd` | `numeric` | да | накопленная стоимость narrative |
| `otherAiCostUsd` | `numeric` | да | прочие AI-расходы |
| `createdAt` | `timestamptz` | да | дата создания |
| `updatedAt` | `timestamptz` | да | дата обновления |

### 8.3 Комментарий

Для миров и персонажей hidden cap может проверяться не только по `UserUsagePeriod`, но и по текущему числу активных сущностей. Оба механизма допустимы, но должны быть согласованы в `Billing & Subscription Spec`.

---

## 9. WorldTemplate

### 9.1 Назначение

Хранит базовые шаблоны миров для быстрого старта и управляемой генерации.

### 9.2 Поля

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | `uuid` | да | PK |
| `slug` | `text` | да | уникальный системный идентификатор |
| `title` | `text` | да | название шаблона |
| `genre` | `text` | нет | жанр |
| `tone` | `text` | нет | тон |
| `description` | `text` | нет | краткое описание |
| `templateData` | `jsonb` | да | структурированные данные шаблона |
| `isActive` | `boolean` | да | доступен ли шаблон |
| `createdAt` | `timestamptz` | да | дата создания |
| `updatedAt` | `timestamptz` | да | дата обновления |

---

## 10. World

### 10.1 Назначение

Хранит конкретный мир игрока или системный мир, который используется в приключениях.

### 10.2 Поля

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | `uuid` | да | PK |
| `ownerUserId` | `uuid` | да | FK -> `User.id` |
| `templateId` | `uuid` | нет | FK -> `WorldTemplate.id` |
| `status` | `world_status` | да | статус генерации и жизни мира |
| `visibility` | `world_visibility` | да | публичность |
| `deathMode` | `world_death_mode` | да | для MVP только `NORMAL` |
| `title` | `text` | да | название мира |
| `genre` | `text` | нет | жанр |
| `tone` | `text` | нет | тон мира |
| `userInput` | `text` | нет | исходное описание игрока |
| `shortDescription` | `text` | нет | краткое описание |
| `worldData` | `jsonb` | да | ключевые факты, локации, фракции, hooks |
| `generationModel` | `text` | нет | модель генерации |
| `generationStatusReason` | `text` | нет | причина failed/archived при необходимости |
| `createdAt` | `timestamptz` | да | дата создания |
| `updatedAt` | `timestamptz` | да | дата обновления |

### 10.3 Рекомендация по `worldData`

`worldData` рекомендуется хранить в виде `jsonb`, потому что туда удобно складывать:

- key facts
- locations
- factions
- setting rules
- initial hooks

При этом основные user-facing поля вроде `title`, `genre`, `tone`, `shortDescription` лучше держать отдельными колонками.

---

## 11. Character

### 11.1 Назначение

Хранит персонажа пользователя и его текущее состояние.

### 11.2 MVP-ограничение

Для MVP персонаж привязан к одному миру.

Это упрощает:

- генерацию предыстории;
- сессии;
- правила;
- hidden caps;
- хранение состояния.

### 11.3 Поля

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | `uuid` | да | PK |
| `ownerUserId` | `uuid` | да | FK -> `User.id` |
| `worldId` | `uuid` | да | FK -> `World.id` |
| `status` | `character_status` | да | статус персонажа |
| `name` | `text` | да | имя |
| `archetypeLabel` | `text` | нет | flavor-ярлык, не механика |
| `backstory` | `text` | нет | краткая предыстория |
| `motivation` | `text` | нет | стартовая цель/мотивация |
| `physicalStat` | `integer` | да | 2/3/4 по стартовому правилу |
| `mentalStat` | `integer` | да | 2/3/4 по стартовому правилу |
| `socialStat` | `integer` | да | 2/3/4 по стартовому правилу |
| `hpCurrent` | `integer` | да | текущее HP |
| `hpMax` | `integer` | да | максимум HP |
| `inventory` | `jsonb` | да | предметы и их простые эффекты |
| `createdAt` | `timestamptz` | да | дата создания |
| `updatedAt` | `timestamptz` | да | дата обновления |

### 11.4 Комментарий по inventory

`inventory` в MVP может храниться как `jsonb`, потому что система предметов пока простая:

- название
- тип
- короткое описание
- опциональный ситуативный эффект

Если позже предметы станут глубже, это можно выделить в отдельную таблицу.

---

## 12. AdventureSession

### 12.1 Назначение

Хранит активную или завершенную игровую сессию.

### 12.2 Поля

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | `uuid` | да | PK |
| `ownerUserId` | `uuid` | да | FK -> `User.id` |
| `worldId` | `uuid` | да | FK -> `World.id` |
| `characterId` | `uuid` | да | FK -> `Character.id` |
| `status` | `session_status` | да | статус сессии и lock-состояние |
| `currentTurnId` | `uuid` | нет | FK -> `TurnExecution.id` |
| `processingStartedAt` | `timestamptz` | нет | время начала активной обработки |
| `lastErrorCode` | `text` | нет | последний системный код ошибки |
| `turnCount` | `integer` | да | число завершенных ходов |
| `dangerLevel` | `danger_level` | да | текущая опасность сцены |
| `sceneGoal` | `text` | нет | локальная цель текущей сцены |
| `resultText` | `text` | нет | последний результат хода |
| `sceneText` | `text` | нет | текущая сцена |
| `availableChoices` | `jsonb` | да | 3-4 текущих варианта действий |
| `summaryState` | `jsonb` | да | сжатое состояние/summary для LLM |
| `startedAt` | `timestamptz` | да | старт сессии |
| `lastActivityAt` | `timestamptz` | да | последний ход |
| `endedAt` | `timestamptz` | нет | завершение |
| `createdAt` | `timestamptz` | да | дата создания |
| `updatedAt` | `timestamptz` | да | дата обновления |

### 12.3 Комментарий

`availableChoices`, `summaryState` и текущая сцена должны жить в основной БД как в единственном источнике истины MVP.

---

## 13. TurnExecution

### 13.1 Назначение

Хранит технический жизненный цикл одного хода и нужен для:

- lock-механизма;
- recovery;
- idempotency;
- latency breakdown;
- AI cost tracking;
- диагностики ошибок.

### 13.2 Поля

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | `uuid` | да | PK |
| `sessionId` | `uuid` | да | FK -> `AdventureSession.id` |
| `userId` | `uuid` | да | FK -> `User.id` |
| `characterId` | `uuid` | да | FK -> `Character.id` |
| `status` | `turn_execution_status` | да | этап обработки |
| `idempotencyKey` | `text` | нет | защита от повторного submit |
| `inputType` | `input_type` | да | preset/free |
| `selectedOptionId` | `text` | нет | выбранный вариант |
| `rawActionText` | `text` | нет | исходный ввод игрока |
| `normalizedIntent` | `text` | нет | результат нормализации |
| `normalizerModel` | `text` | нет | модель normalizer |
| `narrativeModel` | `text` | нет | модель narrative step |
| `normalizerLatencyMs` | `integer` | нет | latency normalizer |
| `narrativeLatencyMs` | `integer` | нет | latency narrative |
| `totalLatencyMs` | `integer` | нет | total turn latency |
| `normalizerCostUsd` | `numeric` | нет | стоимость normalizer |
| `narrativeCostUsd` | `numeric` | нет | стоимость narrative |
| `fallbackUsed` | `boolean` | да | был ли fallback |
| `errorCode` | `text` | нет | код ошибки |
| `errorMessage` | `text` | нет | диагностическое сообщение |
| `gameEventId` | `uuid` | нет | FK -> `GameEvent.id` после успеха |
| `startedAt` | `timestamptz` | да | начало |
| `finishedAt` | `timestamptz` | нет | завершение |
| `createdAt` | `timestamptz` | да | дата создания |

### 13.3 Комментарий

`TurnExecution` и `GameEvent` не дублируют друг друга:

- `TurnExecution` нужен для operational tracking;
- `GameEvent` нужен для gameplay history.

---

## 14. GameEvent

### 14.1 Назначение

Хранит завершенный игровой ход как часть истории сессии.

### 14.2 Поля

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | `uuid` | да | PK |
| `sessionId` | `uuid` | да | FK -> `AdventureSession.id` |
| `characterId` | `uuid` | да | FK -> `Character.id` |
| `sequenceNumber` | `integer` | да | порядковый номер в сессии |
| `inputType` | `input_type` | да | preset/free |
| `selectedOptionId` | `text` | нет | выбранный вариант |
| `rawActionText` | `text` | нет | исходный текст |
| `normalizedIntent` | `text` | нет | структурированный intent |
| `actionCategory` | `action_category` | нет | категория действия |
| `primaryStat` | `character_stat` | нет | выбранная характеристика |
| `resolutionMode` | `resolution_mode` | нет | auto/check |
| `difficultyDc` | `integer` | нет | сложность |
| `statValue` | `integer` | нет | значение характеристики |
| `statModifier` | `integer` | нет | модификатор характеристики |
| `situationalModifier` | `integer` | нет | ситуативный модификатор |
| `rollMode` | `roll_mode` | нет | normal/advantage/disadvantage |
| `rolls` | `jsonb` | нет | массив бросков |
| `totalResult` | `integer` | нет | итог |
| `outcome` | `outcome_type` | нет | success/partial/failure |
| `outcomeSeverity` | `outcome_severity` | нет | critical/normal |
| `consequenceType` | `consequence_type` | нет | тип последствия |
| `hpBefore` | `integer` | нет | HP до |
| `hpAfter` | `integer` | нет | HP после |
| `systemResolution` | `jsonb` | да | полный структурный результат rules engine |
| `resultText` | `text` | да | narrative-результат текущего действия |
| `sceneText` | `text` | да | новая сцена |
| `sceneGoal` | `text` | нет | локальная цель |
| `choices` | `jsonb` | да | 3-4 новых варианта действий |
| `eventSummary` | `text` | да | краткая запись для истории |
| `createdAt` | `timestamptz` | да | дата создания |

### 14.3 Комментарий

`systemResolution` нужен, чтобы можно было:

- дебажить правила;
- пересматривать исходы;
- строить аналитику без парсинга narrative-текста.

---

## 15. AiRequestLog

### 15.1 Назначение

Хранит обращения к LLM и нужен для экономики, мониторинга и отладки.

### 15.2 Поля

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `id` | `uuid` | да | PK |
| `feature` | `ai_feature` | да | тип AI-запроса |
| `status` | `ai_request_status` | да | успех/ошибка/fallback |
| `provider` | `text` | да | OpenAI / Anthropic / Google / OpenRouter и т.п. |
| `model` | `text` | да | имя модели |
| `userId` | `uuid` | нет | FK -> `User.id` |
| `sessionId` | `uuid` | нет | FK -> `AdventureSession.id` |
| `characterId` | `uuid` | нет | FK -> `Character.id` |
| `worldId` | `uuid` | нет | FK -> `World.id` |
| `turnExecutionId` | `uuid` | нет | FK -> `TurnExecution.id` |
| `promptTokens` | `integer` | нет | входные токены |
| `completionTokens` | `integer` | нет | выходные токены |
| `latencyMs` | `integer` | нет | latency |
| `costUsd` | `numeric` | нет | стоимость запроса |
| `errorCode` | `text` | нет | код ошибки |
| `createdAt` | `timestamptz` | да | дата создания |

### 15.3 Комментарий

Это одна из ключевых сущностей для контроля экономики MVP.

---

## 16. Что хранить в `jsonb`, а что отдельными полями

### 16.1 Отдельные поля

Лучше хранить отдельными колонками:

- email
- plan
- subscription status
- title/genre/tone мира
- stats персонажа
- hp
- session status
- danger level
- difficulty DC
- outcome
- consequence type

Причина:

- по ним нужны фильтры, индексы и аналитика.

### 16.2 `jsonb`

Лучше хранить как `jsonb`:

- `worldData`
- `inventory`
- `availableChoices`
- `summaryState`
- `rolls`
- `systemResolution`
- `choices`
- `payload` billing event

Причина:

- структура может развиваться;
- в MVP не нужна глубокая нормализация этих сущностей.

---

## 17. Основные связи

### 17.1 Пользовательская часть

- `User 1 -> N World`
- `User 1 -> N Character`
- `User 1 -> N AdventureSession`
- `User 1 -> N UserUsagePeriod`
- `User 1 -> N UserSubscription`

### 17.2 Игровая часть

- `World 1 -> N Character`
- `World 1 -> N AdventureSession`
- `Character 1 -> N AdventureSession`
- `AdventureSession 1 -> N TurnExecution`
- `AdventureSession 1 -> N GameEvent`
- `TurnExecution 1 -> 0..1 GameEvent`

### 17.3 AI и биллинг

- `UserSubscription 1 -> N BillingEvent` опционально через user/provider linkage
- `TurnExecution 1 -> N AiRequestLog`
- `World 1 -> N AiRequestLog`
- `Character 1 -> N AiRequestLog`

---

## 18. Ключевые ограничения и индексы

### 18.1 Обязательные уникальные ограничения

- `User.email` unique
- `BillingEvent.providerEventId` unique
- `WorldTemplate.slug` unique
- `UserUsagePeriod (userId, periodStart)` unique
- `GameEvent (sessionId, sequenceNumber)` unique
- `TurnExecution (sessionId, idempotencyKey)` unique при наличии idempotency key

### 18.2 Индексы, которые нужны в MVP

- `World.ownerUserId`
- `Character.ownerUserId`
- `Character.worldId`
- `AdventureSession.ownerUserId`
- `AdventureSession.characterId`
- `AdventureSession.status`
- `TurnExecution.sessionId`
- `TurnExecution.status`
- `GameEvent.sessionId, sequenceNumber`
- `AiRequestLog.feature, createdAt`
- `AiRequestLog.model, createdAt`
- `UserSubscription.userId, status`

### 18.3 Частичные/логические ограничения

В MVP желательно обеспечить:

- не более одной активной сессии на персонажа;
- не более одного `currentTurnId` в активной обработке на сессию;
- невозможность создать новый ход, если сессия уже в `PROCESSING_TURN`.

Это может быть реализовано частично на уровне БД, частично в сервисной логике.

---

## 19. Session lock и recovery в модели данных

Для механики последовательности ходов минимально необходимы:

- `AdventureSession.status`
- `AdventureSession.currentTurnId`
- `AdventureSession.processingStartedAt`
- `TurnExecution.status`
- `TurnExecution.startedAt`
- `TurnExecution.finishedAt`

Этих полей достаточно, чтобы:

- определить stuck session;
- понять, какой ход завис;
- восстановить или завершить обработку;
- не принимать второй параллельный ход.

---

## 20. Hidden caps и billing enforcement в модели

Для MVP hidden caps должны опираться на данные, которые можно проверять на backend.

Минимально нужно уметь проверять:

- сколько ходов уже сделал пользователь в текущем периоде;
- сколько миров у него уже активно;
- сколько персонажей у него уже активно;
- какой у него effective plan сейчас.

Поэтому для enforcement в сервисе должны использоваться:

- `User.plan`
- `UserSubscription.status`
- `UserUsagePeriod.turnCount`
- count активных `World`
- count активных `Character`

---

## 21. Что можно не моделировать отдельно в MVP

На первом этапе не обязательно выделять в отдельные сущности:

- `Item`
- `Location`
- `Faction`
- `NPC`
- `PromptVersion`
- `ModerationCase`
- `Friendship`
- `SessionInvite`
- `DeathWorld`

Эти данные можно хранить как часть `jsonb`-структур или отложить на следующие фазы.

---

## 22. Открытые решения

Следующие решения можно принять позже, если текущая модель уже устраивает backend:

- нужен ли отдельный `EntitlementOverride` для ручной выдачи доступа;
- нужен ли отдельный `PromptConfig` table;
- нужен ли отдельный `SessionSnapshot` beyond current scene fields;
- нужно ли хранить полные prompt/response payloads в БД или только в логах/обсервабилити;
- нужна ли таблица `ModerationLog` уже в MVP или позже.

---

## 23. Главный вывод

Минимальная модель данных MVP должна покрывать 5 контуров одновременно:

- identity and billing;
- hidden caps and usage;
- worlds and characters;
- sessions and turns;
- AI cost and monitoring.

Если хотя бы один из этих контуров не будет отражен в модели данных, то запуск либо усложнится, либо станет плохо наблюдаемым и трудно управляемым.
