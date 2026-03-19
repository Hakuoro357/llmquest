# LLM-TextQuest Admin Console Spec

## Назначение документа

Этот документ описывает внутреннюю админку `LLM-TextQuest` для MVP.

Ее задача — не быть "вторым продуктом", а дать команде минимальный, но достаточный набор инструментов для:

- поддержки пользователей;
- управления подписками и доступом;
- просмотра и восстановления сессий;
- контроля AI-расходов и качества pipeline;
- управления шаблонами и базовыми настройками;
- реагирования на инциденты.

Связанные документы:

- [LLM-TextQuest-MVP.md](D:\pro\LMQuest\LLM-TextQuest-MVP.md)
- [LLM-TextQuest-Data-Model-Spec.md](D:\pro\LMQuest\LLM-TextQuest-Data-Model-Spec.md)
- [LLM-TextQuest-API-Spec.md](D:\pro\LMQuest\LLM-TextQuest-API-Spec.md)
- [LLM-TextQuest-MVP-Monitoring.md](D:\pro\LMQuest\LLM-TextQuest-MVP-Monitoring.md)
- [LLM-TextQuest-MVP-Launch-Checklist.md](D:\pro\LMQuest\LLM-TextQuest-MVP-Launch-Checklist.md)

---

## 1. Роль админки в MVP

Админка в MVP должна быть:

- внутренним инструментом;
- максимально утилитарной;
- ориентированной на recovery, support и контроль экономики;
- ограниченной по scope.

Админка в MVP **не должна** пытаться стать:

- полноценной BI-системой;
- full-featured CMS;
- системой глубокой ручной модерации всего контента;
- отдельным большим продуктом для внутренней команды.

Главный принцип:

- все, что критично для запуска и поддержки MVP, должно быть в админке;
- все, что "можно и через SQL", но часто понадобится в бою, тоже лучше иметь в админке;
- все остальное можно оставить за пределами первой версии.

---

## 2. Главные задачи админки

Для MVP админка должна закрывать 6 задач:

1. Найти пользователя и понять его текущее состояние.
2. Найти конкретную сессию и понять, почему она сломалась или зависла.
3. Управлять `Free / Premium` доступом и billing edge cases.
4. Видеть AI cost, ошибки генерации и деградацию pipeline.
5. Управлять шаблонами и безопасными feature-toggle настройками.
6. Давать команде быстрый способ recovery без прямой работы руками в БД.

---

## 3. Роли доступа

### 3.1 Минимальная ролевая модель MVP

Для MVP достаточно трех внутренних ролей:

- `SUPERADMIN`
- `OPS_ADMIN`
- `SUPPORT`

### 3.2 Описание ролей

`SUPERADMIN`

- полный доступ ко всем разделам;
- управление ролями и доступами;
- доступ к billing overrides;
- доступ к системным настройкам и feature flags.

`OPS_ADMIN`

- доступ к пользователям, сессиям, AI Ops, monitoring и recovery;
- может снимать lock, повторять шаги recovery, менять внутренние operational флаги;
- не должен управлять ролями других администраторов без отдельного разрешения.

`SUPPORT`

- просмотр пользователя, подписки и сессий;
- просмотр ошибок и истории;
- ограниченные ручные действия вроде resend email или мягкого subscription note;
- без доступа к опасным системным действиям.

### 3.3 Чего не делать в MVP

Для MVP не нужен слишком сложный RBAC с десятками permission-ов.

Лучше:

- 3 понятные роли;
- audit log на чувствительные действия;
- поэтапное усложнение позже.

---

## 4. Основные разделы админки

Для MVP я бы закладывал 8 разделов:

1. Dashboard
2. Users
3. Billing
4. Sessions
5. AI Ops
6. Worlds & Templates
7. Monitoring / Incidents
8. Audit Log

---

## 5. Dashboard

### 5.1 Назначение

Главный экран админки должен быстро отвечать на вопрос:

- "система сейчас здорова или нет?"

### 5.2 Что показывать

- `DAU / WAU / MAU`
- active `Free`
- active `Premium`
- новые подписки за день / неделю
- cancel rate
- общий AI spend за день
- `cost per free user`
- `cost per premium user`
- gross margin snapshot
- число turn failures за день
- p95 total turn latency
- число stuck sessions
- последние инциденты

### 5.3 Что важно

Dashboard MVP должен быть скорее operational, чем декоративным.

На первом экране важнее видеть:

- деньги;
- ошибки;
- деградацию pipeline;

чем красивые продуктовые графики.

---

## 6. Users

### 6.1 Назначение

Раздел нужен для поддержки и решения проблем конкретного пользователя.

### 6.2 Поиск и фильтры

Нужно уметь искать по:

- `userId`
- email
- display name
- статусу подписки
- тарифу
- дате регистрации
- last seen

### 6.3 Карточка пользователя

В карточке пользователя стоит показывать:

- `userId`
- email
- display name
- current plan
- subscription status
- дата регистрации
- last activity
- текущий usage period snapshot
- число миров
- число персонажей
- число сессий
- число failed turns
- AI spend за текущий период

### 6.4 Действия в карточке пользователя

Для MVP полезны такие действия:

- вручную выдать `Premium`
- вручную вернуть на `Free`
- установить/снять блокировку пользователя
- просмотреть активные сессии
- просмотреть billing-события
- просмотреть usage snapshot
- открыть последние ошибки пользователя

### 6.5 Чего не надо в MVP

Не нужно:

- редактировать narrative history руками;
- давать поддержку доступ к опасным системным массовым операциям;
- делать слишком глубокую CRM-логику.

---

## 7. Billing

### 7.1 Назначение

Раздел нужен, чтобы разбирать подписки и платежные edge cases без прямого лезания в Stripe.

### 7.2 Что показывать

- текущие active subscriptions
- canceled subscriptions
- past_due subscriptions
- failed payment cases
- recent billing events
- refunds / disputes, если они появятся

### 7.3 Карточка подписки

Нужно видеть:

- user
- current plan
- provider
- subscription status
- current period start/end
- cancel at period end
- history of billing events
- ручные notes для support/ops

### 7.4 Разрешенные действия

Для MVP достаточно:

- открыть checkout history / event history
- пометить кейс как проверенный
- вручную обновить effective access после сбоя webhook
- вручную выдать временный доступ
- вручную снять временный доступ

### 7.5 Чего не надо в MVP

Не нужно превращать админку в полноценную платежную панель с собственным reconciliation engine.

---

## 8. Sessions

### 8.1 Назначение

Это один из самых важных разделов админки для MVP.

Он нужен для:

- разбора зависших ходов;
- просмотра текущей сцены;
- диагностики failed turn pipeline;
- проверки, не ломается ли rules engine/LLM contract.

### 8.2 Список сессий

Нужны фильтры:

- `sessionId`
- `userId`
- `characterId`
- `status`
- `dangerLevel`
- `processing_turn`
- `error`
- `lastActivityAt`

### 8.3 Карточка сессии

Нужно показывать:

- id сессии
- пользователь
- персонаж
- мир
- status
- current turn id
- processing started at
- turn count
- last activity
- current danger level
- current scene goal
- current scene text
- current choices
- last error code

### 8.4 Действия с сессией

Для MVP полезны:

- снять lock
- перевести сессию из `ERROR` в `IDLE`
- просмотреть последний `TurnExecution`
- просмотреть последние `GameEvent`
- просмотреть latency breakdown последнего хода
- посмотреть AI cost последнего хода

### 8.5 Просмотр turn pipeline

Очень полезно иметь подэкран или drawer, где видно по ходу:

- raw action
- normalized intent
- action category
- primary stat
- DC
- rolls
- outcome
- consequence type
- normalizer model
- narrative model
- latencies
- fallback used
- validation status

Это сэкономит очень много времени на поддержке.

---

## 9. AI Ops

### 9.1 Назначение

Раздел нужен, чтобы следить за качеством и себестоимостью AI-конвейера как за отдельной системой.

### 9.2 Что показывать

- usage by model
- AI spend by feature
- AI spend by model
- normalizer latency
- narrative latency
- invalid JSON rate
- fallback rate
- retry rate
- validation failure rate
- cost per turn
- cost per world generation
- cost per character generation

### 9.3 Фильтры

- период
- feature
- provider
- model
- status
- fallback used

### 9.4 Полезные действия

Для MVP достаточно:

- отключить конкретную модель через feature flag
- сменить default model for feature
- временно включить fallback-only режим
- ограничить дорогой feature при деградации

### 9.5 Чего не надо в MVP

Не нужно сразу делать полноценную prompt-lab платформу.

Но полезно иметь:

- просмотр актуальных промптов по feature
- и версию prompt-конфига

если это не слишком сложно.

---

## 10. Worlds & Templates

### 10.1 Назначение

Раздел нужен для контроля стартового контента и debugging мира.

### 10.2 Что должно быть

`World Templates`

- список шаблонов
- включен / выключен
- title / genre / tone
- quick preview
- редактирование template data

`Worlds`

- список созданных миров
- owner
- status
- visibility
- generation model
- generation failures

### 10.3 Действия

Для MVP полезны:

- создать шаблон
- отредактировать шаблон
- выключить шаблон
- пересоздать мир вручную при failed generation
- архивировать проблемный мир

### 10.4 Осторожность

Редактирование уже созданного мира должно быть ограничено, чтобы не ломать активные сессии.

---

## 11. Monitoring / Incidents

### 11.1 Назначение

Этот раздел должен связывать дашборды с реальными operational действиями.

### 11.2 Что показывать

- активные инциденты
- последние алерты
- stuck sessions count
- turn failure spikes
- latency spikes
- AI spend spikes
- payment failures spike

### 11.3 Incident карточка

Если инциденты логируются отдельно, полезно видеть:

- тип инцидента
- severity
- affected users count
- started at
- current status
- owner
- resolution note

### 11.4 Минимум для MVP

Если отдельной incident-system нет, хотя бы нужен список последних критических алертов и связанных сущностей.

---

## 12. Audit Log

### 12.1 Назначение

Все чувствительные действия в админке должны оставлять audit trail.

### 12.2 Что обязательно логировать

- изменение тарифа пользователя
- блокировку/разблокировку пользователя
- ручное снятие lock сессии
- изменение системного feature flag
- ручной recovery billing access
- выключение шаблона
- ручную архивацию мира

### 12.3 Формат записи

Audit log должен включать:

- кто выполнил действие
- когда
- над какой сущностью
- старое значение
- новое значение
- причину или note

---

## 13. Feature Flags и runtime-настройки

### 13.1 Нужен ли отдельный раздел

Да, хотя бы в простом виде.

Для MVP это может быть частью `AI Ops` или отдельной вкладкой.

### 13.2 Что полезно переключать

- default normalizer model
- default narrative model
- fallback mode
- world generation on/off
- character generation on/off
- premium checkout availability
- hidden cap policy version
- soft launch allowlist mode

### 13.3 Чего не делать

Не стоит делать слишком сложную систему флагов с деревом зависимостей.

---

## 14. Что должно быть только через админку, а не через БД

Для MVP лучше не делать руками через SQL то, что часто понадобится в реальной поддержке.

Через админку должны быть доступны:

- снять stuck lock
- посмотреть session pipeline
- посмотреть billing state
- выдать/снять premium
- посмотреть usage пользователя
- посмотреть AI cost по пользователю и сессии
- выключить проблемный шаблон
- увидеть последние системные ошибки

Если это останется "только через БД", на запуске будет слишком хрупко.

---

## 15. Что можно отложить

Вне MVP-админки можно оставить:

- массовую модерацию UGC
- полноценную CRM
- тонкую ролевую матрицу
- deep experiment platform
- расширенный редактор prompt-ов
- финансовый reconciliation dashboard
- автоматический refund management

---

## 16. Минимальный технический состав админки

Для MVP достаточно:

- закрытый `/admin` route
- server-side auth check
- role check
- базовые таблицы/карточки
- action endpoints с audit logging

Не обязательно с первого дня:

- отдельный дизайн-системный продуктовый уровень polish
- сложная микрофронтенд-структура
- отдельный backend только под админку

---

## 17. Предлагаемая структура меню

Рекомендуемый sidebar:

- Dashboard
- Users
- Billing
- Sessions
- AI Ops
- Worlds & Templates
- Monitoring
- Audit Log
- Settings

`Settings` для MVP может включать:

- feature flags
- runtime defaults
- admin-only system notes

---

## 18. Главный вывод

Для MVP админка должна быть не "красивой панелью", а инструментом operational control.

Если коротко, без нее команде будет слишком тяжело:

- поддерживать пользователей;
- чинить зависшие сессии;
- управлять доступом и подпиской;
- контролировать AI cost;
- реагировать на инциденты.

Самый важный приоритет админки на первой версии:

- users
- billing
- sessions
- AI ops
- audit log

Все остальное можно добавлять позже.
