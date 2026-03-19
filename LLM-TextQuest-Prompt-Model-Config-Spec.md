# LLM-TextQuest Prompt & Model Config Spec

## Назначение документа

Этот документ описывает конфигурацию AI-слоя для MVP `LLM-TextQuest`.

Его задача — зафиксировать:

- какие модели используются для каких задач;
- какие промпты существуют;
- какие параметры считаются runtime-конфигом;
- как устроены fallback-и;
- как versioning промптов и моделей влияет на production;
- как безопасно выкатывать изменения.

Связанные документы:

- [LLM-TextQuest-MVP.md](D:\pro\LMQuest\LLM-TextQuest-MVP.md)
- [LLM-TextQuest-Game-Rules-Spec.md](D:\pro\LMQuest\LLM-TextQuest-Game-Rules-Spec.md)
- [LLM-TextQuest-Turn-Contract.md](D:\pro\LMQuest\LLM-TextQuest-Turn-Contract.md)
- [LLM-TextQuest-MVP-Economics.md](D:\pro\LMQuest\LLM-TextQuest-MVP-Economics.md)
- [LLM-TextQuest-MVP-Monitoring.md](D:\pro\LMQuest\LLM-TextQuest-MVP-Monitoring.md)
- [LLM-TextQuest-Content-Safety-Moderation-Spec.md](D:\pro\LMQuest\LLM-TextQuest-Content-Safety-Moderation-Spec.md)

---

## 1. Зачем нужен отдельный config layer

Для MVP нельзя зашивать модель и prompt прямо в код как "магические строки", если:

- есть несколько AI-фич;
- есть fallback-и;
- важны экономика и latency;
- нужны безопасные rollout-и.

Поэтому AI-слой MVP должен быть configurable.

Это не значит, что нужен огромный prompt-platform продукт. Но нужен минимальный управляемый слой, где фиксируются:

- `feature -> default model`
- `feature -> fallback model`
- `feature -> prompt version`
- основные generation параметры

---

## 2. Основные AI-фичи MVP

Для MVP закладываются следующие AI-фичи:

- `INPUT_NORMALIZER`
- `NARRATIVE_TURN`
- `WORLD_GENERATION`
- `CHARACTER_GENERATION`
- `SUMMARY_GENERATION`
- `MODERATION_INPUT`
- `MODERATION_OUTPUT`

### 2.1 Роль каждой фичи

`INPUT_NORMALIZER`

- выделяет intent игрока;
- делает structured normalization;
- не решает механику.

`NARRATIVE_TURN`

- генерирует `resultText`, `sceneText`, `choices`, `eventSummary`, `sceneGoal`;
- работает только поверх рассчитанного system resolution.

`WORLD_GENERATION`

- генерирует мир из prompt/template.

`CHARACTER_GENERATION`

- генерирует предысторию, стартовую мотивацию, начальный narrative слой.

`SUMMARY_GENERATION`

- генерирует summary blocks для истории.

`MODERATION_INPUT` / `MODERATION_OUTPUT`

- проверяют пользовательский и AI-generated контент.

---

## 3. Рекомендуемая модельная архитектура MVP

### 3.1 Базовая архитектура

Для MVP рекомендуется:

- `Input Normalizer` — отдельная более быстрая и дешевая модель;
- `Narrative Turn` — более сильная narrative-модель;
- `World / Character Generation` — та же сильная модель или отдельная, если экономика требует;
- `Moderation` — специализированный moderation endpoint;
- `Rules Engine` — без LLM.

### 3.2 Базовый выбор по умолчанию

С учетом продуктовых и экономических решений разумно закладывать такие default choices:

- `INPUT_NORMALIZER`: легкая модель с хорошим structured output
- `NARRATIVE_TURN`: основная narrative-модель, выбранная по качеству/цене
- `WORLD_GENERATION`: может совпадать с `NARRATIVE_TURN`
- `CHARACTER_GENERATION`: может совпадать с `NARRATIVE_TURN`
- `SUMMARY_GENERATION`: допускается более дешевая модель, если качество достаточно
- `MODERATION_*`: OpenAI Moderation API

### 3.3 Важный принцип

Модель для narrative не должна автоматически становиться моделью для normalizer, moderation и summary только "потому что она уже подключена".

---

## 4. Что должно быть конфигурируемым

Для каждой AI-фичи должны быть конфигурируемыми:

- `provider`
- `model`
- `promptVersion`
- `fallbackProvider`
- `fallbackModel`
- `temperature`
- `maxOutputTokens`
- `timeoutMs`
- `retryCount`
- `enabled`

Опционально:

- `responseFormat`
- `safetyMode`
- `providerRoutingMode`
- `costGuardrailUsd`

---

## 5. Prompt versioning

### 5.1 Зачем нужен versioning

Даже в MVP prompt changes могут:

- ломать качество сцены;
- ломать JSON-контракт;
- повышать latency;
- повышать cost;
- ломать moderation baseline.

Поэтому prompt должен иметь явную версию.

### 5.2 Минимальная схема versioning

Для MVP достаточно:

- `feature`
- `promptVersion`
- `active`
- `notes`
- `updatedAt`

Пример:

- `INPUT_NORMALIZER:v1`
- `NARRATIVE_TURN:v3`
- `WORLD_GENERATION:v2`

### 5.3 Что хранить в версии

Каждая версия должна иметь:

- system prompt
- developer / policy additions
- required output schema
- short notes о цели версии

---

## 6. Feature-by-feature конфигурация

### 6.1 `INPUT_NORMALIZER`

#### Назначение

- интерпретация ввода игрока;
- выделение первого значимого действия;
- structured output.

#### Требования к модели

- быстрая;
- дешевая;
- стабильная в JSON/structured output;
- не слишком "творческая".

#### Рекомендуемые параметры

- низкая температура
- короткий max output
- строгая схема ответа
- короткий timeout
- 1 retry максимум

#### Fallback

- fallback на более надежную модель;
- либо простой rule-based fallback для грубых случаев.

### 6.2 `NARRATIVE_TURN`

#### Назначение

- генерация результата хода и новой сцены.

#### Требования к модели

- хорошее narrative quality;
- удержание tone;
- соблюдение контрактов;
- приемлемая latency;
- приемлемая unit economics.

#### Рекомендуемые параметры

- умеренная температура;
- ограниченный max output;
- строгий response schema;
- явный scene length budget.

#### Fallback

- fallback на более дешевую или более стабильную narrative-модель;
- либо safe template response, если генерация невалидна.

### 6.3 `WORLD_GENERATION`

#### Назначение

- создание мира на старте.

#### Требования

- более высокий quality bar, чем у хода;
- но latency не так критична, как для `NARRATIVE_TURN`.

#### Параметры

- можно допустить чуть больший output budget;
- нужен structured output.

### 6.4 `CHARACTER_GENERATION`

#### Назначение

- создание narrative-слоя персонажа.

#### Требования

- краткость;
- согласованность с миром;
- structured fields + flavor text.

### 6.5 `SUMMARY_GENERATION`

#### Назначение

- суммаризация истории.

#### Требования

- дисциплина формата;
- дешевизна;
- низкая hallucination rate;
- не нужна сильная литературность.

#### Вывод

Это хороший кандидат на более дешевую модель.

### 6.6 `MODERATION_INPUT` / `MODERATION_OUTPUT`

#### Назначение

- policy check, а не генерация.

#### Решение MVP

- OpenAI Moderation API
- без замены narrative-моделью

---

## 7. Prompt structure

### 7.1 Общий принцип

У каждого AI feature должен быть prompt package, а не просто одна строка.

Минимальный состав package:

- `systemPrompt`
- `taskPromptTemplate`
- `schemaRequirements`
- `safetyAdditions`
- `notes`

### 7.2 Для чего это нужно

Чтобы можно было отдельно менять:

- роль модели;
- формат ответа;
- safety ограничения;
- feature-specific instructions.

### 7.3 Важный запрет

В MVP нельзя смешивать в одном prompt:

- business policy,
- game rules,
- huge style guide,
- debug instructions,
- случайные временные правки

в один неуправляемый "монолит".

---

## 8. Конфигурация generation параметров

### 8.1 Что должно быть явно настроено

Для каждой фичи желательно явно задавать:

- `temperature`
- `max_output_tokens`
- `timeout_ms`
- `retry_count`
- `schema_strict_mode`

### 8.2 Рекомендуемые принципы

`INPUT_NORMALIZER`

- минимальная температура;
- короткий output;
- короткий timeout.

`NARRATIVE_TURN`

- умеренная температура;
- ограниченный output;
- timeout чуть выше.

`SUMMARY_GENERATION`

- низкая температура;
- короткий output;
- schema-first.

`WORLD_GENERATION` / `CHARACTER_GENERATION`

- чуть больше budget, но тоже в рамках лимита.

---

## 9. Fallback стратегия

### 9.1 Почему fallback обязателен

В AI-продукте MVP без fallback-ов слишком хрупок.

Нужен fallback минимум для:

- normalizer failure;
- invalid narrative response;
- timeout narrative response;
- moderation-triggered output block;
- temporary model outage.

### 9.2 Уровни fallback-а

Для MVP достаточно 3 уровней:

1. `retry same model`
2. `fallback model`
3. `safe template response`

### 9.3 Пример для `NARRATIVE_TURN`

Если narrative generation:

- возвращает невалидный JSON;
- timeout-ится;
- или дает unsafe output;

то:

1. один retry;
2. fallback narrative model;
3. если снова fail — safe template response.

### 9.4 Пример для `INPUT_NORMALIZER`

Если normalizer:

- выдает invalid JSON;
- не может выделить intent;

то:

1. один retry;
2. fallback model;
3. простой deterministic fallback:
   - взять первую фразу;
   - пометить input как broad/unclear;
   - передать в rules engine с консервативной обработкой.

---

## 10. Cost guardrails

### 10.1 Зачем нужны

Экономика MVP чувствительна к:

- слишком дорогой narrative-модели;
- слишком длинным output-ам;
- runaway retries;
- случайным provider changes.

### 10.2 Что нужно ограничивать

Для каждой фичи полезно иметь:

- max output budget
- max retries
- max acceptable latency
- max acceptable cost per call

### 10.3 Runtime behavior

Если cost guardrail нарушается:

- feature может перейти на fallback model;
- или в degraded mode;
- или ограничить богатство narrative, сохранив core gameplay.

---

## 11. Rollout и изменение конфигурации

### 11.1 Базовый принцип

Менять model/prompt config напрямую в production без rollback-стратегии нельзя.

### 11.2 Для MVP достаточно

- manual rollout через admin/config;
- запись версии prompt/model в лог каждого AI request;
- быстрый rollback на предыдущую рабочую конфигурацию.

### 11.3 Что должно логироваться

Каждый AI request должен знать:

- `feature`
- `provider`
- `model`
- `promptVersion`
- `fallbackUsed`

Иначе потом невозможно понять, что именно сломало качество.

---

## 12. Runtime settings и feature flags

### 12.1 Что стоит выносить в runtime config

- default model per feature
- fallback model per feature
- enable/disable feature
- enable/disable expensive model
- safe mode
- degraded mode
- max retries
- max output tokens

### 12.2 Что не стоит делать в MVP

Не стоит строить сверхсложную distributed config platform.

Для MVP достаточно:

- конфиг в БД или config file
- админский override
- audit log изменений

---

## 13. Monitoring конфигурации моделей и промптов

### 13.1 Что нужно видеть

- latency by feature/model
- cost by feature/model
- invalid response rate by feature/model
- fallback rate by feature/model
- moderation block rate by feature/model
- retry rate by feature/model

### 13.2 Почему это важно

Без этого нельзя понять:

- какая модель реально тянет MVP;
- где экономика уплывает;
- где prompt-version ухудшила качество.

---

## 14. Что должно быть в админке

Для MVP в админке должно быть видно:

- default model per feature
- fallback model per feature
- active prompt version per feature
- feature enabled/disabled
- recent changes
- runtime notes

Полезные действия:

- сменить default model
- включить fallback-only mode
- переключить prompt version
- отключить дорогую модель
- включить safe mode

Все эти действия должны оставлять audit trail.

---

## 15. Что можно отложить

На MVP можно отложить:

- сложную prompt CMS;
- live A/B testing prompt variants;
- automatic bandit routing between models;
- self-optimizing cost-quality router;
- deep experiment framework.

---

## 16. Минимальный launch-ready baseline

Перед запуском MVP должно быть готово:

- назначение модели для каждой AI feature;
- fallback model для normalizer и narrative;
- versioned prompts;
- moderation config;
- cost guardrails;
- runtime возможность быстро выключить проблемную модель;
- логирование provider/model/promptVersion на каждом AI request.

---

## 17. Главный вывод

AI-слой MVP должен быть не "набором вызовов модели", а управляемой конфигурацией.

Если коротко, launch-ready baseline для `LLM-TextQuest` выглядит так:

- одна feature = одна четкая роль
- у каждой feature есть default model и fallback
- prompts versioned
- moderation отделена от narrative
- runtime config и rollback существуют
- cost/latency guardrails включены

Это делает систему управляемой, наблюдаемой и достаточно устойчивой для запуска.
