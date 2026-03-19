# LLM-TextQuest Infra & Deployment Spec

## Назначение документа

Этот документ описывает инфраструктуру и deployment-стратегию MVP `LLM-TextQuest`.

Его задача — зафиксировать:

- какие окружения существуют;
- из каких сервисов состоит MVP-инфраструктура;
- как выполняется деплой;
- как управляются миграции и секреты;
- как делаются backup и recovery;
- как выполняется rollout и rollback;
- какие operational правила обязательны перед запуском.

Связанные документы:

- [LLM-TextQuest-MVP.md](D:\pro\LMQuest\LLM-TextQuest-MVP.md)
- [LLM-TextQuest-Data-Model-Spec.md](D:\pro\LMQuest\LLM-TextQuest-Data-Model-Spec.md)
- [LLM-TextQuest-API-Spec.md](D:\pro\LMQuest\LLM-TextQuest-API-Spec.md)
- [LLM-TextQuest-MVP-Monitoring.md](D:\pro\LMQuest\LLM-TextQuest-MVP-Monitoring.md)
- [LLM-TextQuest-MVP-Launch-Checklist.md](D:\pro\LMQuest\LLM-TextQuest-MVP-Launch-Checklist.md)
- [LLM-TextQuest-Billing-Subscription-Spec.md](D:\pro\LMQuest\LLM-TextQuest-Billing-Subscription-Spec.md)
- [LLM-TextQuest-Prompt-Model-Config-Spec.md](D:\pro\LMQuest\LLM-TextQuest-Prompt-Model-Config-Spec.md)

---

## 1. Принципы MVP-инфраструктуры

Инфраструктура MVP строится по следующим правилам:

1. Простота важнее гибкости.
2. Managed services предпочтительнее self-hosting.
3. Production должна быть наблюдаемой с первого дня.
4. Rollback должен быть проще, чем hotfix вручную.
5. Данные и доступы важнее "идеальной" DevOps-архитектуры.

Следствие:

- один основной web/backend runtime;
- managed Postgres;
- hosted email и billing provider;
- без сложного оркестратора и без premature microservices.

---

## 2. Целевая инфраструктура MVP

### 2.1 Базовый стек

Для MVP рекомендуется:

- `Next.js` application
- `Vercel` для frontend + server runtime
- `Supabase Postgres` или эквивалентный managed PostgreSQL
- `Resend` для transactional email
- `Stripe` для billing
- внешний AI-провайдер(ы) для generation и moderation

### 2.2 Что входит в production path

Production path MVP:

- клиент открывает web app;
- web app общается с `/api/v1`;
- backend читает/пишет в Postgres;
- backend использует Postgres и для short-lived operational state MVP;
- backend вызывает AI providers;
- backend вызывает Stripe / Resend;
- monitoring/alerting получает метрики и ошибки.

---

## 3. Окружения

### 3.1 Минимально необходимые окружения

Для MVP достаточно трех окружений:

- `local`
- `staging`
- `production`

### 3.2 Назначение окружений

`local`

- разработка;
- ручная отладка;
- локальные миграции;
- безопасная работа с моками и тестовыми ключами.

`staging`

- интеграционная проверка;
- smoke-тесты;
- проверка миграций;
- проверка billing/auth/inference flows на sandbox-ключах.

`production`

- реальные пользователи;
- реальные платежи;
- реальные hidden caps;
- реальные monitoring/alerting.

### 3.3 Чего избегать

Для MVP не нужно:

- много промежуточных окружений;
- отдельное demo/preprod окружение;
- ветка на каждый ephemeral environment, если это сильно усложняет CI/CD.

---

## 4. Состав сервисов по окружениям

### 4.1 Local

Минимально:

- локальный app runtime;
- локальная или удаленная dev БД;
- локальный `.env.local`;
- мок или test credentials для AI, Stripe и email.

### 4.2 Staging

Должны быть отдельные:

- staging deployment;
- staging database;
- test Stripe keys;
- test email setup;
- staging AI config / low-risk providers.

### 4.3 Production

Должны быть отдельные:

- production deployment;
- production database;
- production secrets;
- production Stripe account/keys;
- production email domain setup;
- production monitoring and alerting.

Критично:

- никакие staging keys или staging webhooks не должны жить в prod.

---

## 5. Домены и доступ

### 5.1 Домены

Минимально нужны:

- production domain
- staging subdomain

Пример:

- `app.example.com`
- `staging.example.com`

### 5.2 Админка

Админка должна быть:

- под отдельным route `/admin`;
- защищена server-side auth;
- ограничена по ролям;
- желательно дополнительно ограничена allowlist/VPN/basic access layer на раннем этапе.

### 5.3 HTTPS

Во всех окружениях, кроме части local-development, должен использоваться HTTPS.

---

## 6. Secret management

### 6.1 Что считается секретом

Секретами считаются:

- DB connection strings
- AI provider keys
- moderation keys
- Stripe secret keys
- webhook signing secrets
- Resend API key
- auth/session secrets
- admin bootstrap credentials

### 6.2 Правила

- секреты не хранятся в репозитории;
- секреты управляются через environment variables или managed secret store;
- staging и production secrets разделены;
- rotation должна быть возможна без ручной правки кода.

### 6.3 Что нужно для запуска

Нужно иметь документированный список обязательных env vars:

- app/runtime
- auth
- database
- ai providers
- moderation
- billing
- email
- monitoring
- admin flags

---

## 7. Конфигурация окружений

### 7.1 Что должно быть конфигом, а не кодом

Конфигом должны быть:

- app base URL
- feature flags
- default/fallback AI models
- billing plan codes
- moderation mode
- hidden cap policy version
- rollout toggles
- safe/degraded mode

### 7.2 Что важно

Изменение environment config не должно требовать переписывания бизнес-логики.

---

## 8. База данных и миграции

### 8.1 Источник истины

Основной источник истины для данных:

- `PostgreSQL`

### 8.2 Миграции

Для MVP рекомендуется:

- все schema changes проводить только через versioned migrations;
- миграции должны быть частью deployment process;
- staging migrations должны выполняться до production migrations.

### 8.3 Правила миграций

- никаких ручных schema-изменений в production без зафиксированного migration artifact;
- destructive migrations — только осознанно и отдельно;
- перед risky migration нужен backup;
- миграции должны быть backward-conscious, насколько это возможно.

### 8.4 Seed data

Для MVP полезно иметь:

- seed world templates;
- seed admin user или bootstrap admin flow;
- базовые runtime configs.

---

## 9. PostgreSQL и operational state MVP

### 9.1 Что хранится в PostgreSQL помимо основных данных

В MVP отдельный state-store слой не используется. Помимо основных данных, в `PostgreSQL` хранятся:

- session locks;
- текущая сцена и `availableChoices`;
- short-lived operational markers;
- rate limiting и usage counters.

### 9.2 Что обязано жить в PostgreSQL как в единственном источнике истины

Нельзя выносить из основной БД в единственный ephemeral-слой:

- персонажа;
- активной сцены;
- истории сессии;
- billing-состояния;
- session lock и статуса обработки хода.

### 9.3 Recovery правило

Если приложение падает, рестартуется или теряет in-memory состояние:

- session lock и `PROCESSING_TURN` состояние должны восстанавливаться из БД-логики;
- текущая сцена и история сессии должны дочитываться из `PostgreSQL`;
- gameplay не должен irreversibly ломаться.

---

## 10. Хранилище логов и observability

### 10.1 Что обязательно

Для MVP нужно:

- application logs;
- structured turn logs;
- error tracking;
- metrics;
- alerting.

### 10.2 Что желательно

- отдельный dashboard для AI Ops;
- отдельный dashboard для billing/economics;
- инцидентные alerts.

### 10.3 Что важно

Нельзя запускать MVP, если:

- нет логов по ходу;
- нет error tracking;
- нет алертов на turn failure / stuck session.

---

## 11. CI/CD

### 11.1 Минимальный pipeline

Перед деплоем в `staging` и `production` должны выполняться:

- install dependencies
- typecheck
- lint
- tests, если они есть
- build

### 11.2 Production deploy flow

Рекомендуемый flow:

1. merge в main / release branch
2. deploy в staging
3. smoke test staging
4. run migrations
5. production deploy
6. post-deploy smoke test
7. monitoring check

### 11.3 Что не делать

Нельзя:

- делать прод-деплой без smoke-проверки;
- выполнять опасные миграции "на лету" без rollback-плана;
- считать билд успешным, если только "задеплоилось".

---

## 12. Rollout стратегия

### 12.1 Рекомендуемый подход для MVP

Лучший вариант:

- gated launch
- soft launch на маленькой аудитории
- постепенное расширение

### 12.2 Feature flags

Через feature flags полезно уметь:

- включать/выключать world generation
- включать/выключать premium checkout
- переключать AI models
- включать safe mode
- включать degraded mode

### 12.3 Почему это важно

Если что-то ломается, вы должны иметь возможность:

- не останавливать весь продукт;
- а деградировать только проблемный кусок.

---

## 13. Rollback стратегия

### 13.1 Что должно быть rollback-able

Для MVP rollback должен существовать минимум для:

- web deployment
- AI config / prompt version
- feature flags
- billing access behavior

### 13.2 Что сложнее откатывать

Труднее всего откатывать:

- destructive DB migrations
- уже обработанные billing события
- уже созданные gameplay-состояния

Поэтому:

- risky migrations — отдельно и осознанно;
- billing logic changes — с высокой осторожностью;
- prompt/model config — желательно с быстрым переключением назад.

### 13.3 Минимальный operational rollback

Команда должна уметь:

- откатить deployment;
- отключить проблемную модель;
- включить fallback-only режим;
- отключить premium checkout;
- снять зависшие lock-и.

---

## 14. Backup и recovery

### 14.1 Что бэкапить

Минимально:

- Postgres
- критичные runtime configs
- prompt/model config snapshots
- audit-worthy billing state

### 14.2 Что нужно уметь

Команда должна уметь:

- восстановить БД из backup;
- восстановить доступ после проблемного billing deploy;
- восстановить app runtime после bad release;
- продолжить работу после рестарта приложения без потери operational state.

### 14.3 Recovery baseline

Нужен минимум:

- documented restore procedure;
- список ответственных;
- порядок действий для `db restore`, `feature rollback`, `AI fallback mode`.

---

## 15. Third-party dependency strategy

### 15.1 Основные внешние зависимости

MVP зависит от:

- Vercel
- Postgres provider
- AI provider(s)
- Stripe
- Resend

### 15.2 Что важно

Для каждой внешней зависимости полезно понимать:

- как проверить health;
- что ломается при ее недоступности;
- есть ли fallback или degraded mode;
- кто владелец инцидента внутри команды.

### 15.3 Самые чувствительные зависимости

Наиболее критичны:

- Postgres
- AI provider для `NARRATIVE_TURN`
- Stripe webhook path

---

## 16. Нагрузочный baseline

### 16.1 Что важно тестировать

Для MVP нужно хотя бы минимально протестировать:

- одновременные turn submit-ы;
- session lock contention;
- narrative generation latency;
- DB write path for `GameEvent` + `TurnExecution`;
- всплеск world/character generation.

### 16.2 Что считать базовым стрессом

Не нужен full-scale enterprise load test, но нужен realistic MVP load profile:

- несколько десятков одновременных активных turn requests;
- bursts после промо/рассылки;
- repeated submit under latency.

---

## 17. Billing и webhook deployment особенности

### 17.1 Что важно

Billing нельзя выкатывать как "просто еще один endpoint".

Нужно:

- отдельные test webhook secrets для staging;
- replay-safe webhook processing;
- audit trail для billing events;
- monitoring payment failures.

### 17.2 Перед production запуском

Нужно проверить:

- checkout success
- checkout failure
- cancel at period end
- failed renewal
- webhook replay
- manual access override

---

## 18. Admin доступ и безопасность

### 18.1 Правила

- `/admin` недоступен публично без auth;
- internal actions логируются;
- dangerous actions ограничены ролями;
- production admin access должен быть минимальным.

### 18.2 Что особенно чувствительно

- billing overrides
- session unlock
- user blocking
- feature flag changes
- model switching

---

## 19. Минимальный launch-ready baseline

Перед launch MVP должно быть готово:

- `local / staging / production`
- managed DB
- secrets разделены по окружениям
- versioned migrations
- working CI/CD
- post-deploy smoke tests
- monitoring + alerting
- backup + restore procedure
- rollback path
- feature flags
- admin access protection

---

## 20. Что можно отложить

На MVP можно отложить:

- Kubernetes / сложный оркестратор
- multi-region architecture
- advanced queueing platform
- service mesh
- infra-as-code высокой сложности, если команда пока не готова
- zero-downtime DB migration machinery enterprise-уровня
- отдельный deployment platform beyond managed stack

---

## 21. Главный вывод

Для `LLM-TextQuest` инфраструктура MVP должна быть простой, managed и rollback-friendly.

Если коротко, надежный baseline выглядит так:

- `Vercel + managed Postgres`
- `local / staging / production`
- versioned migrations
- strict secrets separation
- monitored production
- backup/recovery documented
- feature flags + rollback ready

Этого достаточно, чтобы запускать MVP без лишней инфраструктурной сложности, но и без опасной "ручной" эксплуатации.
