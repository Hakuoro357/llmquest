# LLM-TextQuest QA / Test Plan

## Назначение документа

Этот документ фиксирует стратегию тестирования MVP `LLM-TextQuest`.

Его задача — ответить на вопросы:

- что именно должно быть протестировано до реального трафика;
- какие проверки обязательны в `local`, `staging` и перед `production`;
- какие сценарии считаются критичными для запуска;
- как команда понимает, что релиз можно выпускать, а что блокирует запуск.

Связанные документы:

- [LLM-TextQuest-MVP.md](D:\pro\LMQuest\LLM-TextQuest-MVP.md)
- [LLM-TextQuest-Game-Rules-Spec.md](D:\pro\LMQuest\LLM-TextQuest-Game-Rules-Spec.md)
- [LLM-TextQuest-Turn-Contract.md](D:\pro\LMQuest\LLM-TextQuest-Turn-Contract.md)
- [LLM-TextQuest-Data-Model-Spec.md](D:\pro\LMQuest\LLM-TextQuest-Data-Model-Spec.md)
- [LLM-TextQuest-API-Spec.md](D:\pro\LMQuest\LLM-TextQuest-API-Spec.md)
- [LLM-TextQuest-Billing-Subscription-Spec.md](D:\pro\LMQuest\LLM-TextQuest-Billing-Subscription-Spec.md)
- [LLM-TextQuest-Content-Safety-Moderation-Spec.md](D:\pro\LMQuest\LLM-TextQuest-Content-Safety-Moderation-Spec.md)
- [LLM-TextQuest-Prompt-Model-Config-Spec.md](D:\pro\LMQuest\LLM-TextQuest-Prompt-Model-Config-Spec.md)
- [LLM-TextQuest-Infra-Deployment-Spec.md](D:\pro\LMQuest\LLM-TextQuest-Infra-Deployment-Spec.md)
- [LLM-TextQuest-MVP-Monitoring.md](D:\pro\LMQuest\LLM-TextQuest-MVP-Monitoring.md)
- [LLM-TextQuest-MVP-Launch-Checklist.md](D:\pro\LMQuest\LLM-TextQuest-MVP-Launch-Checklist.md)

---

## 1. Принципы тестирования MVP

Тестирование MVP строится по следующим правилам:

1. Проверяется не только код, но и целостность игрового опыта.
2. Критичные пользовательские сценарии важнее широкого покрытия второстепенных функций.
3. Один сломанный ход, потерянная сессия или некорректный billing state считаются launch-blocker.
4. AI-пайплайн тестируется как контрактная система, а не как "магический" black box.
5. Все, что влияет на деньги, данные пользователя и последовательность ходов, должно иметь отдельные негативные тесты.
6. Перед запуском MVP важнее стабильность и recovery, чем глубина edge-case polish.

Следствие:

- у проекта должен быть небольшой, но обязательный regression suite;
- staging должен проверять реальные интеграции, а не только mocks;
- релиз без smoke и launch-blocker review не допускается.

---

## 2. Цели тест-плана

До запуска MVP тестирование должно подтвердить:

- пользователь может пройти путь `signup -> world -> character -> first session -> first turn -> resume`;
- один ход обрабатывается последовательно и не дублируется;
- rules engine, input normalizer и narrative step согласованы между собой;
- hidden caps, billing states и ограничения тарифов работают корректно;
- moderation и fallback-поведение не ломают pipeline;
- система выдерживает раннюю ожидаемую нагрузку без деградации UX и экономики;
- команда умеет обнаружить и восстановить ключевые сбои.

---

## 3. Область покрытия

В scope тестирования MVP входят:

- auth и account flows;
- создание мира;
- создание персонажа;
- запуск и продолжение одиночной сессии;
- submit одного хода;
- rules resolution;
- prompt / model orchestration;
- billing и `Free / Premium`;
- moderation;
- monitoring, logging и alertability;
- admin/ops critical actions;
- backup/recovery базового уровня.

Не входят в обязательный MVP test scope:

- мультиплеер;
- сложные live-ops сценарии;
- массовая ручная модерация;
- advanced A/B infrastructure;
- mobile-native клиенты.

---

## 4. Окружения и типы проверок

### 4.1 Local

Используется для:

- unit tests;
- component tests;
- локальных integration tests;
- prompt contract tests на безопасных ключах или mock-ответах;
- ручной отладки edge cases.

### 4.2 Staging

Обязательно для:

- end-to-end smoke;
- реальных вызовов БД;
- sandbox billing flows;
- moderation flows;
- AI-provider integration checks;
- migration verification;
- pre-release regression suite.

### 4.3 Production

В production допускаются только:

- post-deploy smoke;
- canary verification;
- мониторинг реального состояния;
- ручная проверка нескольких golden-path сценариев на ограниченной аудитории.

Production не должен быть местом первой проверки критичных сценариев.

---

## 5. Уровни тестирования

### 5.1 Unit tests

Должны покрывать:

- rules engine helpers;
- DC calculation;
- outcome classification;
- modifier application;
- HP updates;
- hidden cap evaluation;
- billing plan resolution;
- session lock logic;
- error mapping;
- schema validation helpers.

### 5.2 Integration tests

Должны покрывать:

- API + Postgres;
- session lock acquisition/release;
- turn persistence;
- `GameEvent` creation;
- usage counter updates;
- subscription state update from webhook;
- moderation pipeline integration;
- prompt config loading and fallback selection.

### 5.3 Contract tests

Должны покрывать:

- `Turn Contract`;
- structured output normalizer;
- structured output narrative response;
- response validator;
- compatibility между API payload, DB model и stored event shape.

### 5.4 End-to-end tests

Должны покрывать пользовательские сценарии целиком:

- signup / login;
- create world;
- create character;
- start session;
- submit first turn;
- submit free-text turn;
- resume session;
- upgrade to premium;
- hit plan cap;
- cancel subscription.

### 5.5 AI / prompt regression tests

Должны проверять:

- normalizer выдает валидный JSON;
- narrative step не противоречит rules outcome;
- scene length держится в рамках;
- choices возвращаются в нужном количестве;
- summary не пустой и не ломает continuity;
- moderation-блокировка срабатывает на запрещенных кейсах;
- fallback-модель выдает приемлемый ответ.

### 5.6 Load and resilience tests

Должны проверять:

- параллельные submit по одной сессии;
- параллельные submit по разным сессиям;
- burst на turn endpoint;
- webhook burst;
- рост `PROCESSING_TURN` rows;
- recovery после неуспешного narrative step;
- recovery после рестарта runtime.

---

## 6. Обязательные MVP test suites

### 6.1 Suite A: Core gameplay happy path

Обязательные сценарии:

- пользователь регистрируется;
- создает мир из шаблона;
- создает персонажа;
- начинает сессию;
- получает первую сцену;
- отправляет preset action;
- получает результат;
- отправляет free-text action;
- закрывает приложение;
- возвращается и видит resume state.

Эта suite должна быть зеленой в staging перед каждым релизом.

### 6.2 Suite B: Turn safety and data integrity

Обязательные сценарии:

- повторный submit не создает второй ход;
- два параллельных submit в одну сессию не проходят одновременно;
- неуспешный narrative step не портит последнюю валидную сцену;
- невалидный JSON normalizer не ломает pipeline;
- невалидный narrative response не сохраняется как успешный ход;
- lock снимается после controlled failure;
- зависший `PROCESSING_TURN` можно безопасно восстановить.

### 6.3 Suite C: Rules engine correctness

Обязательные сценарии:

- выбор сильной и слабой характеристики работает корректно;
- stat modifier считается корректно;
- `AUTO_SUCCESS` не делает бросок;
- `AUTO_FAIL` не делает бросок;
- `CHECK` делает бросок ровно один раз;
- `advantage` и `disadvantage` применяются корректно;
- `SUCCESS / PARTIAL_SUCCESS / FAILURE` классифицируются корректно;
- `HP` снижается только в допустимых сценариях;
- поражение сцены не обязано означать `HP` damage;
- ход не дает больше одной серьезной цены.

### 6.4 Suite D: Billing and hidden caps

Обязательные сценарии:

- `Free` user может играть в рамках hidden caps;
- `Free` user получает блокировку по лимиту сообщений;
- `Free` user получает блокировку по лимиту миров;
- `Free` user получает блокировку по лимиту персонажей;
- успешная оплата переводит пользователя в `Premium`;
- отмена подписки ставит `cancel_at_period_end`;
- неуспешный первый платеж не дает `Premium`;
- неуспешный renewal не оставляет бесконечный доступ;
- downgrade на `Free` не ломает уже созданные сущности;
- billing webhook идемпотентен.

### 6.5 Suite E: Moderation and safety

Обязательные сценарии:

- запрещенный user input блокируется до narrative generation;
- запрещенный AI output не отдается пользователю;
- borderline input проходит в допустимых рамках policy;
- self-harm кейсы не получают опасных инструкций;
- sexual/minors кейсы блокируются;
- prompt injection через free-text action не ломает system behavior;
- публичный мир с запрещенным контентом не становится доступным.

### 6.6 Suite F: Admin and ops

Обязательные сценарии:

- support/admin может найти пользователя;
- support/admin может найти сессию;
- support/admin может увидеть stuck turn;
- ops/admin может снять stuck lock;
- ops/admin может вручную изменить effective plan;
- audit log фиксирует чувствительные действия.

### 6.7 Suite G: Monitoring and alertability

Обязательные сценарии:

- ошибки turn pipeline видны в логах;
- AI-request logs сохраняются;
- usage counters видны;
- billing события видны;
- stuck sessions детектятся;
- рост 5xx и DB errors попадает в алерты;
- post-deploy smoke может быть проверен по dashboard-ам.

---

## 7. Детальные тест-категории

### 7.1 Auth and account

Проверить:

- signup;
- login;
- logout;
- session refresh;
- email verification, если включена;
- passwordless/magic-link flow, если он выбран;
- blocked user behavior;
- deleted/disabled account behavior.

### 7.2 World creation

Проверить:

- создание мира из шаблона;
- создание мира из текста;
- валидность структуры сгенерированного мира;
- сохранение статуса `DRAFT/READY/FAILED`;
- публичный и приватный режим;
- корректное поведение при AI failure.

### 7.3 Character creation

Проверить:

- выбор сильной и слабой характеристики;
- корректный итог `4 / 3 / 2`;
- генерацию стартовой предыстории;
- стартовый инвентарь;
- привязку персонажа к миру;
- блокировку по лимиту персонажей.

### 7.4 Session lifecycle

Проверить:

- старт новой сессии;
- запрет второй активной сессии для того же персонажа;
- продолжение существующей сессии;
- завершение сессии;
- поведение `ERROR`;
- поведение `ABANDONED`;
- восстановление после долгого отсутствия.

### 7.5 Turn submit

Проверить:

- preset action;
- free-text action;
- multi-step action trimming;
- пустой ввод;
- слишком длинный ввод;
- unsafe input;
- repeated submit;
- submit без доступа к сессии;
- submit при превышенном лимите тарифа.

### 7.6 AI orchestration

Проверить:

- normalizer primary model;
- normalizer fallback;
- narrative primary model;
- narrative fallback;
- provider timeout;
- retry policy;
- invalid schema response;
- cost logging;
- provider switch через config.

### 7.7 Postgres-only operational state

Проверить:

- lock acquisition через `session_status`;
- `currentTurnId` обновляется корректно;
- `processingStartedAt` ставится и очищается;
- stuck turn recovery работает без отдельного state-store;
- current scene, summary и choices сохраняются атомарно;
- usage counters не теряются при рестарте приложения.

### 7.8 Billing

Проверить:

- checkout session;
- return from checkout;
- webhook signature validation;
- duplicate webhook;
- delayed webhook;
- failed payment;
- cancel at period end;
- downgrade;
- manual admin override;
- visibility effective plan в API и UI.

### 7.9 Content safety

Проверить:

- input moderation;
- output moderation;
- escalation path в admin;
- logging moderation decisions;
- policy-consistent copy для блокировки;
- отсутствие опасных AI-инструкций в ответах.

### 7.10 Admin console

Проверить:

- auth и role-based access;
- user search;
- session search;
- billing search;
- manual unlock;
- plan override;
- AI request inspection;
- audit trail.

---

## 8. Нефункциональные проверки

### 8.1 Производительность

До launch MVP нужно проверить:

- p95 total turn latency на expected load;
- p95 normalizer latency;
- p95 narrative latency;
- p95 DB query latency;
- время восстановления stuck turn.

Пороговые значения должны быть согласованы с [LLM-TextQuest-MVP-Monitoring.md](D:\pro\LMQuest\LLM-TextQuest-MVP-Monitoring.md) и зафиксированы в monitoring alerts.

### 8.2 Надежность

Нужно проверить:

- turn success rate;
- percentage failed turns;
- retry success rate;
- duplicate submit resistance;
- webhook processing reliability;
- отсутствие потери состояния после runtime restart.

### 8.3 Экономика

Нужно проверить:

- cost per free user;
- cost per premium user;
- AI spend per turn;
- cost spikes при аномальном использовании;
- корректность hidden cap enforcement как экономической защиты.

### 8.4 Безопасность

Нужно проверить:

- auth bypass невозможен;
- чужая сессия не читается по API;
- admin endpoints защищены;
- webhook spoofing не проходит;
- секреты не попадают в логи;
- raw prompts и чувствительные user data логируются безопасно.

---

## 9. Тестовые данные и фикстуры

Для MVP рекомендуется подготовить фиксированный набор тестовых сущностей:

- 2 world templates;
- 3 безопасных world prompts;
- 3 risky world prompts;
- 3 character archetype prompts;
- 10 free-text player actions;
- 10 moderation-negative inputs;
- 10 narrative response fixtures;
- 5 webhook payload fixtures;
- 3 stuck-session fixtures.

Отдельно нужен набор golden test cases для AI-regression:

- минимум `30` нормальных сценариев;
- минимум `10` safety-негативных сценариев;
- минимум `10` fallback/error сценариев.

---

## 10. Частота выполнения проверок

### 10.1 На каждый PR

Обязательно:

- unit tests;
- schema validation tests;
- core integration tests;
- lint/typecheck;
- минимальный prompt contract smoke.

### 10.2 На staging deploy

Обязательно:

- migration check;
- e2e happy path;
- turn safety suite;
- billing sandbox suite;
- moderation suite;
- admin critical actions;
- monitoring smoke.

### 10.3 Перед production release

Обязательно:

- весь regression suite;
- load smoke;
- backup/recovery smoke;
- launch-blocker review;
- ручной walkthrough 3-5 golden-path сценариев.

---

## 11. Критерии бага и приоритизация

### 11.1 P0 / launch blocker

К таким багам относятся:

- потеря пользовательских данных;
- двойной ход или сломанная последовательность ходов;
- чужой доступ к данным;
- неработающий billing state;
- опасный неотфильтрованный контент;
- невозможность пройти first-turn flow;
- падение turn pipeline без recovery.

### 11.2 P1

- серьезная деградация core loop;
- частые stuck sessions;
- существенная ошибка hidden caps;
- частый невалидный AI output без fallback;
- серьезные ошибки admin/ops-инструментов.

### 11.3 P2

- UX-ошибки без потери данных;
- редкие edge cases;
- неидеальные, но терпимые narrative artifacts;
- неточности в аналитике, не влияющие на деньги и core gameplay.

---

## 12. Entry / Exit Criteria

### 12.1 Entry criteria для полноценного QA цикла

QA-цикл имеет смысл запускать, когда:

- frozen API shape для MVP уже достаточно стабилен;
- rules spec и turn contract не меняются ежедневно;
- staging окружение доступно;
- billing sandbox и moderation pipeline подключены;
- базовый monitoring включен.

### 12.2 Exit criteria для launch-ready состояния

MVP можно считать тестово готовым к запуску, если:

- все `P0` закрыты;
- нет открытых `P1`, которые ломают core gameplay, billing или safety;
- green весь обязательный regression suite;
- green staging smoke после последнего deploy;
- хотя бы один backup/recovery smoke пройден;
- launch checklist не содержит незакрытых must-have из QA-зоны.

---

## 13. Минимальный regression suite перед запуском

Перед каждым production release должны быть зелеными минимум следующие сценарии:

1. Signup -> create world -> create character -> first turn.
2. Resume existing session -> submit free-text turn.
3. Parallel submit в одну сессию не создает duplicate turn.
4. Narrative provider timeout уходит в controlled failure или fallback.
5. Hidden message cap блокирует следующий ход корректно.
6. Upgrade to premium обновляет effective plan.
7. Cancel subscription не ломает существующий доступ до конца периода.
8. Unsafe input блокируется moderation pipeline.
9. Admin может снять stuck lock.
10. Post-deploy monitoring показывает healthy state.

---

## 14. Практический вывод для MVP

Для `LLM-TextQuest` хороший MVP QA baseline — это не огромная тестовая пирамида, а дисциплинированный набор обязательных проверок вокруг:

- first playable session;
- turn safety;
- billing и hidden caps;
- moderation;
- recovery;
- monitoring visibility.

Если эти зоны закрыты, MVP можно запускать без опасного ощущения, что продукт "работает только в идеальных условиях".
