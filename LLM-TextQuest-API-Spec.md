# LLM-TextQuest API Spec

## Назначение документа

Этот документ описывает минимальный API для MVP `LLM-TextQuest`.

Его задача — перевести продуктовую и архитектурную спецификацию в конкретные HTTP endpoint-ы, контракты запросов и ответов, правила авторизации, коды ошибок и поведение backend.

Связанные документы:

- [LLM-TextQuest-MVP.md](D:\pro\LMQuest\LLM-TextQuest-MVP.md)
- [LLM-TextQuest-Game-Rules-Spec.md](D:\pro\LMQuest\LLM-TextQuest-Game-Rules-Spec.md)
- [LLM-TextQuest-Turn-Contract.md](D:\pro\LMQuest\LLM-TextQuest-Turn-Contract.md)
- [LLM-TextQuest-Data-Model-Spec.md](D:\pro\LMQuest\LLM-TextQuest-Data-Model-Spec.md)
- [LLM-TextQuest-MVP-Economics.md](D:\pro\LMQuest\LLM-TextQuest-MVP-Economics.md)

---

## 1. Общие принципы API

### 1.1 Стиль API

Для MVP используется:

- `JSON over HTTPS`
- session-based auth или cookie-based auth поверх Auth.js / NextAuth
- ресурсный стиль endpoint-ов
- явный versioning через префикс

Базовый префикс:

- `/api/v1`

### 1.2 Цели MVP API

API должен позволять:

- авторизовать пользователя;
- управлять миром и персонажем;
- запускать и продолжать одиночную сессию;
- отправлять ходы;
- читать историю и текущее состояние;
- управлять подпиской;
- собирать billing и monitoring-данные на backend.

### 1.3 Что не входит в MVP API

Не входят:

- мультиплеерные endpoint-ы;
- realtime transport API;
- PvP;
- friend system;
- invites;
- публичный marketplace миров;
- сложная админка.

---

## 2. Авторизация

### 2.1 Базовое правило

Все endpoint-ы, кроме auth/billing-webhook/health, требуют аутентифицированного пользователя.

### 2.2 Модель auth

Для MVP рекомендуется:

- Auth.js / NextAuth
- session cookie
- server-side session validation

### 2.3 Endpoint-ы без пользовательской авторизации

- `/api/v1/auth/*`
- `/api/v1/billing/webhook`
- `/api/v1/health`
- `/api/v1/ready`

---

## 3. Общий формат ошибок

### 3.1 Формат error response

```json
{
  "error": {
    "code": "SESSION_LOCKED",
    "message": "Current session is already processing another turn.",
    "details": null
  }
}
```

### 3.2 Общие error codes

- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `VALIDATION_ERROR`
- `RATE_LIMITED`
- `PLAN_LIMIT_REACHED`
- `SESSION_LOCKED`
- `SESSION_INACTIVE`
- `TURN_ALREADY_PROCESSING`
- `LLM_GENERATION_FAILED`
- `NORMALIZATION_FAILED`
- `STATE_SAVE_FAILED`
- `PAYMENT_FAILED`
- `SUBSCRIPTION_INACTIVE`
- `INTERNAL_ERROR`

### 3.3 HTTP status mapping

- `400` — validation / bad request
- `401` — unauthorized
- `403` — forbidden
- `404` — not found
- `409` — session conflict / lock conflict
- `422` — semantically invalid request
- `429` — rate limited
- `500` — internal error

---

## 4. Health и сервисные endpoint-ы

### 4.1 `GET /api/v1/health`

Назначение:

- простой liveness check

Ответ:

```json
{
  "status": "ok"
}
```

### 4.2 `GET /api/v1/ready`

Назначение:

- readiness check для production

Ответ:

```json
{
  "status": "ready",
  "services": {
    "db": "ok",
    "llm": "ok"
  }
}
```

---

## 5. Auth API

Auth.js/NextAuth большую часть auth flow закрывает сам, но для клиентского приложения полезно зафиксировать несколько служебных endpoint-ов.

### 5.1 `GET /api/v1/me`

Назначение:

- получить текущего пользователя и его effective access state

Ответ:

```json
{
  "user": {
    "id": "user_123",
    "email": "hero@example.com",
    "displayName": "Hero",
    "plan": "FREE"
  },
  "subscription": {
    "status": "INACTIVE",
    "cancelAtPeriodEnd": false,
    "currentPeriodEnd": null
  }
}
```

### 5.2 `GET /api/v1/me/usage`

Назначение:

- получить usage snapshot для клиента и внутренних UX сообщений

Ответ:

```json
{
  "plan": "FREE",
  "usage": {
    "turnCount": 12,
    "worldCreationCount": 1,
    "characterCreationCount": 2
  },
  "limitsState": {
    "turns": "available",
    "worlds": "available",
    "characters": "near_limit"
  }
}
```

Комментарий:

- точные hidden caps пользователю можно не отдавать;
- клиенту достаточно знать состояние `available / near_limit / blocked`.

---

## 6. World API

### 6.1 `GET /api/v1/world-templates`

Назначение:

- список доступных шаблонов миров

Ответ:

```json
{
  "templates": [
    {
      "id": "tpl_1",
      "slug": "dark-fantasy",
      "title": "Dark Fantasy",
      "genre": "Fantasy",
      "tone": "Dark"
    }
  ]
}
```

### 6.2 `GET /api/v1/worlds`

Назначение:

- список миров пользователя

Query params:

- `status`
- `visibility`
- `limit`
- `cursor`

### 6.3 `POST /api/v1/worlds`

Назначение:

- создание нового мира

Правила:

- требует auth
- проверяет hidden cap по мирам
- может использовать template или free text

Request:

```json
{
  "templateId": "tpl_1",
  "userInput": "Мрачный замок на краю мира",
  "visibility": "PRIVATE"
}
```

Response:

```json
{
  "world": {
    "id": "world_123",
    "status": "READY",
    "title": "Замок Серых Ветров",
    "genre": "Темное фэнтези",
    "tone": "Мрачный",
    "shortDescription": "Старый замок, полный интриг и теней."
  }
}
```

Возможные ошибки:

- `PLAN_LIMIT_REACHED`
- `VALIDATION_ERROR`
- `LLM_GENERATION_FAILED`

### 6.4 `GET /api/v1/worlds/:worldId`

Назначение:

- получить мир

### 6.5 `PATCH /api/v1/worlds/:worldId`

Назначение:

- обновить видимость и ограниченный набор editable-полей

### 6.6 `DELETE /api/v1/worlds/:worldId`

Назначение:

- мягкое архивирование мира

Комментарий:

- hard delete в MVP нежелателен

---

## 7. Character API

### 7.1 `GET /api/v1/characters`

Назначение:

- список персонажей пользователя

Query params:

- `worldId`
- `status`
- `limit`
- `cursor`

### 7.2 `POST /api/v1/characters`

Назначение:

- создание нового персонажа

Правила:

- требует auth
- проверяет hidden cap по персонажам
- требует `worldId`
- игрок задает сильную и слабую характеристику

Request:

```json
{
  "worldId": "world_123",
  "name": "Арен",
  "concept": "Молодой дипломат с тяжелым прошлым",
  "strongStat": "SOCIAL",
  "weakStat": "PHYSICAL",
  "archetypeLabel": "Харизматичный"
}
```

Response:

```json
{
  "character": {
    "id": "char_456",
    "name": "Арен",
    "worldId": "world_123",
    "physicalStat": 2,
    "mentalStat": 3,
    "socialStat": 4,
    "hpCurrent": 10,
    "hpMax": 10
  }
}
```

### 7.3 `GET /api/v1/characters/:characterId`

Назначение:

- получить персонажа

### 7.4 `PATCH /api/v1/characters/:characterId`

Назначение:

- ограниченное редактирование неигровых полей

### 7.5 `DELETE /api/v1/characters/:characterId`

Назначение:

- мягкое архивирование персонажа

---

## 8. Session API

### 8.1 `GET /api/v1/sessions`

Назначение:

- список сессий пользователя

Query params:

- `status`
- `characterId`
- `limit`
- `cursor`

### 8.2 `POST /api/v1/sessions`

Назначение:

- создать новую сессию для персонажа

Правила:

- одна активная сессия на персонажа
- если активная сессия уже есть, можно вернуть ошибку или существующую сессию по выбранной бизнес-логике

Request:

```json
{
  "worldId": "world_123",
  "characterId": "char_456"
}
```

Response:

```json
{
  "session": {
    "id": "sess_789",
    "status": "IDLE",
    "turnCount": 0,
    "dangerLevel": "SAFE",
    "sceneGoal": "Осмотреть зал и понять, что происходит",
    "sceneText": "Ты входишь в пустой каменный зал...",
    "choices": [
      { "id": "opt_1", "label": "Осмотреть зал" },
      { "id": "opt_2", "label": "Подойти к двери" },
      { "id": "opt_3", "label": "Позвать кого-нибудь" }
    ]
  }
}
```

### 8.3 `GET /api/v1/sessions/:sessionId`

Назначение:

- получить текущее состояние сессии

Ответ:

```json
{
  "session": {
    "id": "sess_789",
    "status": "IDLE",
    "turnCount": 4,
    "dangerLevel": "RISKY",
    "sceneGoal": "Найти путь к башне",
    "resultText": "Стражник нехотя пропускает тебя.",
    "sceneText": "Ты входишь во внутренний двор...",
    "choices": [
      { "id": "opt_1", "label": "Осмотреть двор" },
      { "id": "opt_2", "label": "Пойти к башне" },
      { "id": "opt_3", "label": "Вернуться к воротам" }
    ]
  },
  "characterState": {
    "hp": 8,
    "stats": {
      "physical": 2,
      "mental": 3,
      "social": 4
    }
  }
}
```

### 8.4 `POST /api/v1/sessions/:sessionId/turns`

Назначение:

- отправить один ход игрока

Этот endpoint должен следовать [LLM-TextQuest-Turn-Contract.md](D:\pro\LMQuest\LLM-TextQuest-Turn-Contract.md).

Request:

```json
{
  "characterId": "char_456",
  "actionType": "FREE",
  "actionText": "Я убеждаю стражника пропустить меня внутрь",
  "selectedOptionId": null
}
```

Response:

```json
{
  "status": "ok",
  "turnId": "turn_001",
  "scene": {
    "resultText": "Стражник хмурится, изучает твою печать и отступает в сторону.",
    "sceneText": "Ты проходишь во внутренний двор замка...",
    "sceneGoal": "Найти безопасный путь к башне",
    "choices": [
      { "id": "opt_1", "label": "Осмотреть двор" },
      { "id": "opt_2", "label": "Пойти к башне" },
      { "id": "opt_3", "label": "Вернуться к воротам" }
    ]
  },
  "characterState": {
    "hp": 8,
    "stats": {
      "physical": 2,
      "mental": 3,
      "social": 4
    }
  }
}
```

Возможные ошибки:

- `SESSION_LOCKED`
- `SESSION_INACTIVE`
- `PLAN_LIMIT_REACHED`
- `NORMALIZATION_FAILED`
- `LLM_GENERATION_FAILED`
- `STATE_SAVE_FAILED`

### 8.5 `GET /api/v1/sessions/:sessionId/events`

Назначение:

- получить историю сессии

Query params:

- `cursor`
- `limit`

Response:

```json
{
  "events": [
    {
      "id": "evt_1",
      "sequenceNumber": 1,
      "rawActionText": "Осмотреть зал",
      "resultText": "Ты замечаешь слабый свет за дверью.",
      "eventSummary": "Герой исследовал зал и обнаружил свет за дверью.",
      "createdAt": "2026-03-20T12:00:00Z"
    }
  ],
  "nextCursor": null
}
```

### 8.6 `POST /api/v1/sessions/:sessionId/finish`

Назначение:

- мягко завершить сессию

### 8.7 `POST /api/v1/sessions/:sessionId/recover`

Назначение:

- внутренний или административный recovery endpoint для stuck session

Комментарий:

- для MVP этот endpoint может быть внутренним и не exposed клиенту напрямую

---

## 9. Billing API

### 9.1 `POST /api/v1/billing/checkout-session`

Назначение:

- создать checkout session для перехода на `Premium`

Request:

```json
{
  "planCode": "premium_monthly"
}
```

Response:

```json
{
  "checkoutUrl": "https://checkout.stripe.com/..."
}
```

### 9.2 `GET /api/v1/billing/subscription`

Назначение:

- получить текущее состояние подписки

### 9.3 `POST /api/v1/billing/subscription/cancel`

Назначение:

- отменить подписку по концу периода

Response:

```json
{
  "status": "ok",
  "subscription": {
    "status": "ACTIVE",
    "cancelAtPeriodEnd": true
  }
}
```

### 9.4 `POST /api/v1/billing/webhook`

Назначение:

- прием webhook-ов от Stripe

Правила:

- endpoint должен быть идемпотентным
- каждое событие сохраняется в `BillingEvent`
- billing event processing не должен зависеть от клиента

---

## 10. Monitoring / internal API

Для MVP можно не делать широкую admin API, но минимальные внутренние endpoint-ы полезны.

### 10.1 `GET /api/v1/internal/metrics-summary`

Назначение:

- агрегированный внутренний operational snapshot

### 10.2 `POST /api/v1/internal/sessions/:sessionId/unlock`

Назначение:

- ручное снятие lock

### 10.3 `POST /api/v1/internal/users/:userId/plan`

Назначение:

- ручной override тарифа

Комментарий:

- эти endpoint-ы не должны быть доступны обычному пользователю

---

## 11. Поведение hidden caps в API

### 11.1 Что проверяется

API должен проверять hidden caps перед:

- созданием мира;
- созданием персонажа;
- отправкой нового хода.

### 11.2 Формат блокирующего ответа

```json
{
  "error": {
    "code": "PLAN_LIMIT_REACHED",
    "message": "Current plan limit reached.",
    "details": {
      "resource": "turns",
      "state": "blocked"
    }
  }
}
```

Комментарий:

- backend может не раскрывать точное численное значение лимита
- клиенту достаточно получить тип ресурса и статус

---

## 12. Идемпотентность и защита от повторной отправки

### 12.1 Идемпотентность turn submit

Для `POST /sessions/:sessionId/turns` рекомендуется использовать:

- `Idempotency-Key` header
- и/или `TurnExecution.idempotencyKey`

Если клиент повторно отправляет тот же ход, backend должен:

- либо вернуть уже созданный результат;
- либо вернуть понятный conflict response;
- но не создавать новый игровой ход поверх старого.

### 12.2 Идемпотентность billing webhook

Для billing webhook:

- `providerEventId` должен быть уникальным;
- повторная доставка не должна приводить к повторной активации подписки.

---

## 13. Rate limiting

### 13.1 Где нужен rate limit

В MVP rate limit нужен минимум для:

- auth endpoint-ов;
- create world;
- create character;
- turn submit;
- checkout session creation;
- webhook endpoint-ов по внутренней политике безопасности.

### 13.2 Цели rate limiting

- защита от abuse;
- защита от runaway AI cost;
- защита от accidental duplicate requests;
- защита от brute-force по auth.

---

## 14. Логирование и observability на уровне API

Для каждого ключевого API-вызова полезно логировать:

- `requestId`
- `userId`
- `sessionId`
- endpoint
- status code
- latency
- model used
- cost if applicable
- fallbackUsed
- errorCode

Особенно это важно для:

- create world
- create character
- turn submit
- billing checkout
- billing webhook

---

## 15. Версионирование API

Для MVP достаточно:

- `/api/v1`

Изменения, ломающие контракт, должны попадать только в новую версию.

Незначимые расширения допускаются в рамках `v1`, если они не ломают старых клиентов.

---

## 16. Минимальный список endpoint-ов MVP

### 16.1 Public/service

- `GET /api/v1/health`
- `GET /api/v1/ready`
- `POST /api/v1/billing/webhook`

### 16.2 Auth/user

- `GET /api/v1/me`
- `GET /api/v1/me/usage`

### 16.3 Worlds

- `GET /api/v1/world-templates`
- `GET /api/v1/worlds`
- `POST /api/v1/worlds`
- `GET /api/v1/worlds/:worldId`
- `PATCH /api/v1/worlds/:worldId`
- `DELETE /api/v1/worlds/:worldId`

### 16.4 Characters

- `GET /api/v1/characters`
- `POST /api/v1/characters`
- `GET /api/v1/characters/:characterId`
- `PATCH /api/v1/characters/:characterId`
- `DELETE /api/v1/characters/:characterId`

### 16.5 Sessions

- `GET /api/v1/sessions`
- `POST /api/v1/sessions`
- `GET /api/v1/sessions/:sessionId`
- `POST /api/v1/sessions/:sessionId/turns`
- `GET /api/v1/sessions/:sessionId/events`
- `POST /api/v1/sessions/:sessionId/finish`

### 16.6 Billing

- `POST /api/v1/billing/checkout-session`
- `GET /api/v1/billing/subscription`
- `POST /api/v1/billing/subscription/cancel`

### 16.7 Internal/ops

- `POST /api/v1/internal/sessions/:sessionId/unlock`
- `POST /api/v1/internal/users/:userId/plan`

---

## 17. Главный вывод

MVP API для `LLM-TextQuest` должен закрывать 5 задач одновременно:

- identity and access;
- gameplay CRUD;
- turn processing;
- billing and hidden caps;
- operational recovery.

Если хотя бы одна из этих задач не отражена в API-контрактах, запуск либо замедлится, либо приведет к плохо управляемой production-системе.
