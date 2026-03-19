# LLM-TextQuest MVP Launch Checklist

## Назначение документа

Этот документ фиксирует checklist готовности `LLM-TextQuest` к запуску MVP на реальных пользователей.

Его задача — дать понятный ответ на вопрос:

- что обязательно должно быть готово до первого реального трафика;
- что обязательно должно быть готово до публичного запуска;
- что желательно, но может быть отложено;
- по каким критериям принимается решение `go / no-go`.

Связанные документы:

- [LLM-TextQuest-MVP.md](D:\pro\LMQuest\LLM-TextQuest-MVP.md)
- [LLM-TextQuest-Game-Rules-Spec.md](D:\pro\LMQuest\LLM-TextQuest-Game-Rules-Spec.md)
- [LLM-TextQuest-Turn-Contract.md](D:\pro\LMQuest\LLM-TextQuest-Turn-Contract.md)
- [LLM-TextQuest-MVP-Economics.md](D:\pro\LMQuest\LLM-TextQuest-MVP-Economics.md)
- [LLM-TextQuest-MVP-Monitoring.md](D:\pro\LMQuest\LLM-TextQuest-MVP-Monitoring.md)

---

## 1. Must-Have Before Any Real Users

### 1.1 Базовая документация

- [ ] Есть основной MVP-документ.
- [ ] Есть `Game Rules Spec`.
- [ ] Есть `Turn Contract`.
- [ ] Есть `MVP Economics`.
- [ ] Есть `MVP Monitoring`.
- [ ] Есть `Data Model Spec`.
- [ ] Есть `API Spec`.
- [ ] Есть `Billing & Subscription Spec`.

### 1.2 Core gameplay pipeline

- [ ] Игрок может зарегистрироваться и войти.
- [ ] Игрок может создать мир.
- [ ] Игрок может создать персонажа.
- [ ] Игрок может запустить первую сессию.
- [ ] Первый ход проходит end-to-end без ручного вмешательства.
- [ ] Система может продолжить сессию после первого хода.
- [ ] Состояние персонажа сохраняется между ходами.
- [ ] История сессии сохраняется между ходами.

### 1.3 Turn safety

- [ ] У одной сессии может быть только один активный ход.
- [ ] Реализован lock/status-механизм на уровне сессии.
- [ ] Повторный submit не создает двойной ход.
- [ ] Stuck session можно восстановить.
- [ ] Ошибка в одном ходе не ломает всю сессию.

### 1.4 AI safety and resilience

- [ ] Есть отдельный normalizer step.
- [ ] Есть narrative generation step.
- [ ] Rules engine не зависит от LLM как от источника механики.
- [ ] Есть валидация ответа normalizer.
- [ ] Есть валидация narrative-ответа.
- [ ] Есть retry policy.
- [ ] Есть fallback response.
- [ ] Невалидный ответ LLM не ломает игровой pipeline.

### 1.5 Monetization baseline

- [ ] Реализованы тарифы `Free` и `Premium`.
- [ ] Hidden caps enforced на backend.
- [ ] Лимиты сообщений работают.
- [ ] Лимиты миров работают.
- [ ] Лимиты персонажей работают.
- [ ] Система умеет корректно блокировать доступ по лимиту.
- [ ] Есть понятный UX-ответ при достижении лимита.

### 1.6 Минимальная операционная безопасность

- [ ] Есть базовый rate limiting.
- [ ] Есть защита от spam / repeated submit.
- [ ] Есть защита от runaway AI cost.
- [ ] Есть базовая moderation/filtering пользовательского текста.
- [ ] Есть базовая moderation/filtering AI output.

### 1.7 Наблюдаемость

- [ ] Есть structured logs по каждому ходу.
- [ ] Есть продуктовые метрики.
- [ ] Есть экономические метрики.
- [ ] Есть AI Ops метрики.
- [ ] Есть инфраструктурные метрики.
- [ ] Есть алерты на turn failures.
- [ ] Есть алерты на stuck sessions.
- [ ] Есть алерты на высокий AI spend.

### 1.8 Ops readiness

- [ ] Есть backup базы данных.
- [ ] Есть recovery-процедура.
- [ ] Есть минимальные admin/ops инструменты.
- [ ] Можно найти конкретную сессию.
- [ ] Можно найти конкретного пользователя.
- [ ] Можно снять зависший lock.
- [ ] Можно вручную поменять тариф или доступ.

---

## 2. Must-Have Before Public Launch

### 2.1 Product readiness

- [ ] Протестирован onboarding нового пользователя.
- [ ] Протестирован возврат к активной сессии.
- [ ] Протестированы сценарии cap reached.
- [ ] Протестирован upgrade в `Premium`.
- [ ] Протестирован cancel flow.
- [ ] Протестирован failed payment flow.

### 2.2 Billing and access behavior

- [ ] Описано поведение после успешной оплаты.
- [ ] Описано поведение после отмены подписки.
- [ ] Описано поведение при неудачном списании.
- [ ] Описано поведение при возврате на `Free`.
- [ ] Описано поведение, если у пользователя уже больше сущностей, чем допускает новый план.

### 2.3 Content safety

- [ ] Есть `Content Safety / Moderation Spec`.
- [ ] Есть правила по нежелательному контенту.
- [ ] Есть правила для пользовательских миров.
- [ ] Есть правила для AI-generated контента.
- [ ] Есть минимальный workflow жалоб или ручной модерации.

### 2.4 Legal and trust

- [ ] Есть privacy policy.
- [ ] Есть terms of service.
- [ ] Есть billing/legal disclosure.
- [ ] Есть базовые возрастные и контентные ограничения.

### 2.5 Launch operations

- [ ] Есть `Launch & Incident Runbook`.
- [ ] Есть gated launch plan.
- [ ] Есть критерии расширения аудитории.
- [ ] Есть rollback-условия.
- [ ] Есть владелец on-call реакции на первую неделю запуска.

---

## 3. Nice-to-Have

### 3.1 Product and analytics

- [ ] Есть event dictionary для аналитики.
- [ ] Есть A/B-ready структура для цен и hidden caps.
- [ ] Есть daily product report.
- [ ] Есть daily economics report.

### 3.2 AI operations

- [ ] Есть versioning промптов.
- [ ] Есть versioning моделей.
- [ ] Есть сравнение quality per model.
- [ ] Есть dashboard повторяемости choice sets.

### 3.3 Support and tooling

- [ ] Есть support FAQ.
- [ ] Есть canned responses для типовых проблем.
- [ ] Есть self-serve help page.
- [ ] Есть расширенные admin tools.

---

## 4. Go / No-Go Criteria

### 4.1 Technical go/no-go

- [ ] Первый ход стабильно проходит end-to-end.
- [ ] p95 total turn latency находится в допустимом диапазоне.
- [ ] Ошибки AI pipeline не ломают сессию.
- [ ] Session lock работает предсказуемо.
- [ ] Нет критичных ошибок сохранения состояния.

### 4.2 Product go/no-go

- [ ] Пользователь без подсказок доходит до первой сцены.
- [ ] Пользователь понимает, что делать дальше.
- [ ] Возврат в активную сессию работает понятно.
- [ ] Upgrade path в `Premium` не ломает flow.

### 4.3 Economic go/no-go

- [ ] `Free`-тариф не уводит сервис в неконтролируемый минус.
- [ ] Hidden caps реально применяются.
- [ ] AI cost на ход соответствует ожиданиям модели или близок к ним.
- [ ] Gross margin не выглядит аварийной уже на тестовой аудитории.

### 4.4 Operational go/no-go

- [ ] Команда умеет восстановить stuck session.
- [ ] Команда умеет обработать failed payment case.
- [ ] Команда умеет временно отключить проблемную модель.
- [ ] Команда умеет быстро сузить gated launch при деградации системы.

---

## 5. Часто забываемые вещи

Перед запуском стоит отдельно спросить себя, не забыто ли следующее:

- [ ] Billing edge cases
- [ ] Failed payment behavior
- [ ] Refund / cancellation behavior
- [ ] Hidden cap behavior
- [ ] Moderation
- [ ] Backups
- [ ] Recovery runbook
- [ ] Admin tooling
- [ ] Legal texts
- [ ] Cost monitoring by model

---

## 6. Минимальное решение о запуске

Запуск MVP можно считать допустимым, если:

- все пункты раздела `Must-Have Before Any Real Users` закрыты;
- все пункты раздела `Go / No-Go` либо закрыты, либо имеют осознанный временный workaround;
- команда понимает, как реагировать на:
  - stuck session;
  - failed generation;
  - рост AI cost;
  - billing issue;
  - пользовательскую жалобу.

Если это не выполнено, запуск лучше считать `no-go`, даже если сама игра уже выглядит играбельной.
