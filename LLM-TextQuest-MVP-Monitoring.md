# LLM-TextQuest MVP Monitoring

## Назначение документа

Этот документ описывает, какой мониторинг нужен для MVP `LLM-TextQuest`, чтобы:

- контролировать экономику продукта;
- видеть качество игрового опыта;
- отслеживать стабильность AI-конвейера;
- обнаруживать технические проблемы до того, как они ломают сессии игроков.

Мониторинг в MVP делится на 4 контура:

- продуктовый;
- экономический;
- AI-операционный;
- инфраструктурный.

Связанные документы:

- [LLM-TextQuest-MVP.md](D:\pro\LMQuest\LLM-TextQuest-MVP.md)
- [LLM-TextQuest-Game-Rules-Spec.md](D:\pro\LMQuest\LLM-TextQuest-Game-Rules-Spec.md)
- [LLM-TextQuest-Turn-Contract.md](D:\pro\LMQuest\LLM-TextQuest-Turn-Contract.md)
- [LLM-TextQuest-MVP-Economics.md](D:\pro\LMQuest\LLM-TextQuest-MVP-Economics.md)

---

## 1. Главный принцип мониторинга

Для MVP недостаточно просто знать, что сервер "жив".

Нужно видеть одновременно:

- игра работает или нет;
- игроки доходят до ценности или нет;
- AI-конвейер окупается или нет;
- free-tier сжигает экономику или нет.

Поэтому минимальный production-мониторинг должен отвечать на 4 вопроса:

1. Игра доступна?
2. Ход игрока успешно проходит весь pipeline?
3. Пользователь получает ценность и возвращается?
4. Каждый сегмент аудитории не уводит продукт в минус?

---

## 2. Продуктовый мониторинг

Продуктовый мониторинг нужен, чтобы понимать не только "есть ли трафик", но и где игрок теряется воронке.

### 2.1 Базовая воронка MVP

Нужно отслеживать:

- регистрация начата;
- регистрация завершена;
- мир создан;
- персонаж создан;
- первая сессия начата;
- первый ход отправлен;
- первый ход успешно обработан;
- первая сессия продолжена;
- пользователь вернулся на следующий день;
- пользователь вернулся в течение 7 дней;
- пользователь дошел до paywall;
- пользователь оформил `Premium`.

### 2.2 Ключевые продуктовые метрики

- `DAU / WAU / MAU`
- число новых пользователей
- число активных free-пользователей
- число активных premium-пользователей
- conversion `Free -> Premium`
- доля пользователей, начавших первую сессию
- доля пользователей, дошедших до первого успешного хода
- среднее число сессий на пользователя
- среднее число ходов на пользователя
- среднее число ходов на сессию
- доля пользователей, вернувшихся к активной сессии
- `D1 / D7 retention`

### 2.3 Игровые продуктовые метрики

Для `LLM-TextQuest` важно отдельно видеть игровой опыт:

- средняя длина сессии в ходах
- средняя длина сессии во времени
- доля свободного ввода против выбора готовых вариантов
- доля слишком широких multi-step действий
- доля автоматических успехов
- доля автоматических невозможностей
- доля `success / partial success / failure`
- доля поражений сцены
- доля сессий, завершившихся на `0 HP`

Если эти метрики перекошены, это сигнал, что rules engine или UX настроены плохо.

---

## 3. Экономический мониторинг

Экономический мониторинг нужен, чтобы постоянно сравнивать реальное поведение игроков с моделью из [LLM-TextQuest-MVP-Economics.md](D:\pro\LMQuest\LLM-TextQuest-MVP-Economics.md).

### 3.1 Главные экономические метрики

- валовая выручка за день / неделю / месяц
- чистая выручка после платежных комиссий
- активные `Premium`-подписки
- новые подписки
- отмены подписки
- refund rate
- direct COGS
- gross margin

### 3.2 Unit economics

Нужно отдельно считать:

- `cost per active free user`
- `cost per active premium user`
- `revenue per premium user`
- `gross profit per premium user`
- долю инфраструктурных расходов в общем COGS
- долю AI-расходов в общем COGS

### 3.3 AI cost monitoring

AI cost нужно считать не в среднем "на аккаунт", а по слоям:

- cost normalizer
- cost narrative generation
- cost world generation
- cost character generation
- cost retries
- cost fallback turns

А также по моделям:

- cost by model
- average tokens in / out by model
- average cost per request by model

### 3.4 Hidden caps monitoring

Так как лимиты скрыты от пользователя, они должны быть очень хорошо видны внутри системы.

Нужно отслеживать:

- сколько free-пользователей приблизились к `50%` внутреннего лимита
- сколько приблизились к `80%`
- сколько достигли `100%`
- сколько уперлись в лимит сообщений
- сколько уперлись в лимит миров
- сколько уперлись в лимит персонажей
- сколько апгрейдов произошло после лимитного блока

Это одна из самых важных метрик monetization MVP.

### 3.5 Экономические тревожные сигналы

Нужно видеть:

- резкий рост `cost per free user`
- рост доли пользователей, выжигающих лимит
- падение `Free -> Premium` conversion
- рост AI cost на ход
- рост retry/fallback cost
- отрицательную gross margin по месяцу

---

## 4. AI-операционный мониторинг

Это отдельный контур, который в AI-продукте так же важен, как CPU и память.

### 4.1 Метрики по normalizer

- latency normalizer
- error rate normalizer
- invalid JSON rate
- schema violation rate
- fallback normalization rate
- ambiguity rate
- доля multi-step действий

### 4.2 Метрики по narrative generation

- latency narrative step
- generation error rate
- invalid response rate
- response validation failure rate
- retry rate
- fallback response rate
- average prompt tokens
- average completion tokens
- average cost per narrative turn

### 4.3 Качественные метрики AI-конвейера

Нужно мониторить:

- долю ответов без `sceneGoal`
- долю ответов без 3-4 валидных вариантов действий
- долю ответов, противоречащих system resolution
- долю слишком длинных сцен
- долю повторяющихся или слишком похожих choice sets
- долю ответов, где LLM пытается "пересчитать" механику

Это не только качество текста, но и качество соблюдения контракта.

### 4.4 Разбиение latency по pipeline

Для каждого хода полезно видеть:

- wait time на `Session Lock`
- latency normalizer
- latency rules engine
- latency narrative generation
- latency validation
- latency save state
- total turn latency

Именно этот breakdown покажет, где реально узкое место.

---

## 5. Инфраструктурный мониторинг

Это стандартный операционный контур, но с поправкой на игровой pipeline.

### 5.1 Golden Signals

Нужно собирать:

- traffic
- latency
- error rate
- saturation

На практике:

- request rate
- p50 / p95 / p99 latency
- 4xx / 5xx rate
- timeout rate
- CPU
- memory
- disk
- network

### 5.2 Backend и API

- latency по endpoint-ам
- error rate по endpoint-ам
- active turn requests
- stuck requests
- failed saves
- duplicate turn submissions
- rate-limited requests

### 5.3 Database

- connection count
- query latency
- slow queries
- lock wait time
- deadlocks
- table growth
- event table growth
- storage usage

### 5.4 PostgreSQL operational state / session locks

- session lock acquisition latency
- failed lock updates
- session lock count
- stale lock count
- stuck lock count
- long-running `PROCESSING_TURN` rows
- rate-limit contention

### 5.5 Email and auth

- email send success rate
- bounce rate
- delivery delay
- login failure rate
- password reset success rate
- auth callback failures

---

## 6. Мониторинг последовательности ходов

Так как у одной сессии в MVP может быть только один обрабатываемый ход одновременно, отдельный мониторинг нужен и для этого механизма.

### 6.1 Что отслеживать

- число сессий в статусе `processing_turn`
- число сессий в статусе `error`
- среднее время нахождения в `processing_turn`
- число lock collisions
- число stuck sessions
- число ручных recovery случаев

### 6.2 Критические сигналы

- сессия находится в `processing_turn` слишком долго
- lock не снимается после ошибки
- растет число повторных submit попыток
- появляются параллельные `currentTurnId` на одну сессию

Если это не отслеживать, игровой pipeline начнет ломаться незаметно.

---

## 7. Набор алертов для MVP

Ниже — минимальный набор, который должен существовать с запуска.

### 7.1 Pager / срочные алерты

- turn failure rate выше допустимого порога
- p95 total turn latency выше допустимого порога
- narrative generation error spike
- normalizer invalid JSON spike
- рост 5xx
- база недоступна
- рост ошибок session lock acquisition
- stuck sessions выше безопасного порога

### 7.2 Несрочные, но важные алерты

- резкий рост AI spend за сутки
- рост `cost per free user`
- рост fallback rate
- падение `Free -> Premium` conversion
- рост пользователей, упирающихся в hidden caps
- резкий рост failed world generation
- резкий рост failed character generation

### 7.3 Ежедневный операционный обзор

Каждый день полезно видеть:

- сколько было ходов
- сколько было успешных ходов
- среднюю latency хода
- AI spend за день
- новых premium-пользователей
- % free users near hidden cap
- gross margin за день

---

## 8. Дашборды MVP

Для MVP достаточно 4 дашбордов.

### 8.1 Product dashboard

- DAU / WAU / MAU
- funnel до первого хода
- retention
- sessions per user
- turns per session

### 8.2 Economics dashboard

- active paid users
- MRR / cash collected
- AI spend
- total COGS
- gross margin
- cost per free user
- cost per premium user
- cap-hit rate

### 8.3 AI Ops dashboard

- turn latency breakdown
- model usage by feature
- invalid JSON
- retries
- fallback rate
- cost per model
- response validation errors

### 8.4 Infra dashboard

- uptime
- request rate
- error rate
- DB latency
- PostgreSQL operational state health
- session lock health
- storage growth

---

## 9. Что логировать на уровне одного хода

Для каждого хода полезно писать structured log с такими полями:

- `userId`
- `sessionId`
- `characterId`
- `turnId`
- `inputType`
- `normalizedIntent`
- `actionCategory`
- `primaryStat`
- `resolutionMode`
- `dc`
- `rollMode`
- `rolls`
- `outcome`
- `consequenceType`
- `hpBefore`
- `hpAfter`
- `normalizerModel`
- `narrativeModel`
- `normalizerLatencyMs`
- `narrativeLatencyMs`
- `totalTurnLatencyMs`
- `normalizerCost`
- `narrativeCost`
- `validationStatus`
- `fallbackUsed`

Это даст и дебаг, и экономику, и аналитику.

---

## 10. Приватность и безопасность логов

Мониторинг не должен превращаться в бесконтрольное хранилище пользовательского текста.

Для MVP стоит зафиксировать:

- не хранить полный сырой пользовательский текст в каждом операционном логе;
- хранить full text только там, где он реально нужен для gameplay history;
- в observability-логах использовать summary или normalized intent;
- ограничить доступ к prompt/response логам;
- отделить продуктовую аналитику от full-content хранилища.

Это особенно важно, если позже появятся публичные миры и пользовательский контент.

---

## 11. Что обязательно нужно с первого дня

Если сильно упростить, то в первый production-launch нельзя выходить без:

- логов по каждому ходу;
- разбивки latency по pipeline;
- метрик AI cost по моделям;
- контроля hidden caps;
- product funnel до первого успешного хода;
- gross margin dashboard;
- алертов на stuck sessions, 5xx и turn failures.

Все остальное можно наращивать позже.

---

## 12. Главный вывод

Для `LLM-TextQuest` мониторинг — это не только DevOps-задача.

MVP должен одновременно наблюдать:

- живет ли продуктовая воронка;
- не ломается ли narrative pipeline;
- не утекают ли деньги на free-tier;
- не зависают ли сессии;
- не деградирует ли quality contract между rules engine и LLM.

Если этого не будет, то даже при хорошей игре будет очень трудно понять:

- почему пользователи уходят;
- почему экономика плывет;
- где именно ломается pipeline одного хода.
