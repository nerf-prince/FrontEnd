
export default function buildUserAnswer(answers: any = {}, subject: any = {}, userId = '') {
  const extractId = (v: any) => {
    if (!v && v !== 0) return ''
    if (typeof v === 'string' || typeof v === 'number') return String(v)
    // mongoose-like {_id: { $oid: '...' }} or {_id: '...'}
    if (v?._id) return extractId(v._id)
    if (v?.$oid) return String(v.$oid)
    if (v?.Id) return extractId(v.Id)
    if (v?.id) return extractId(v.id)
    if (v?.toString && typeof v.toString === 'function') return String(v.toString())
    return ''
  }
  const testId = extractId(subject?.Id ?? subject?._id ?? subject?.TestId ?? '')
  const UserId = userId || answers?.UserId || ''

  // helpers to read user-provided values from multiple possible input shapes
  const readUserVal = (container: any): string => {
    if (container === undefined || container === null) return ''
    if (typeof container === 'string' || typeof container === 'number' || typeof container === 'boolean') return String(container)
    if (typeof container === 'object') {
      // If the object is a simple wrapper like { a: 'value' } or { '': 'value' }, prefer that primitive
      try {
        const keys = Object.keys(container)
        if (keys.length === 1) {
          const single = container[keys[0]]
          if (typeof single === 'string' || typeof single === 'number' || typeof single === 'boolean') return String(single)
        }
      } catch {}
      return container.UserAnswer ?? container.userAnswer ?? container.Selected ?? container.value ?? ''
    }
    return ''
  }

  const ensureEx = (defEx: any, providedEx: any, idx = 0) => {
    // defEx: exercise definition from subject (may be undefined)
    // providedEx: value from answers (could be primitive, object or undefined)
    const sentence = defEx?.Sentence ?? defEx?.sentence ?? (providedEx && typeof providedEx === 'object' ? (providedEx.Sentence ?? providedEx.sentence ?? '') : '')
    const questionNumber = defEx?.QuestionNumber ?? defEx?.questionNumber ?? (idx + 1)
    const answer = defEx?.Answer ?? defEx?.answer ?? (providedEx && typeof providedEx === 'object' ? (providedEx.Answer ?? providedEx.answer ?? '') : '')
    const options = defEx?.Options ?? defEx?.options ?? (providedEx && typeof providedEx === 'object' ? (providedEx.Options ?? providedEx.options ?? '') : '')
    let userAnswer = readUserVal(providedEx)
    // if userAnswer is a single letter (a,b,c,d) and we have Options, map it to the full option text
    const optsRaw = options || ''
    if ((userAnswer === 'a' || userAnswer === 'b' || userAnswer === 'c' || userAnswer === 'd' || /^[abcd]$/i.test(userAnswer)) && optsRaw) {
      const parts = String(optsRaw).split('$').map((s: string) => s.trim()).filter(Boolean)
      const idxLetter = (userAnswer || '').toLowerCase().charCodeAt(0) - 97
      if (parts[idxLetter] !== undefined) userAnswer = parts[idxLetter]
    }
    const score = (providedEx && typeof providedEx === 'object' && typeof providedEx.Score === 'number') ? providedEx.Score : 0

    return {
      Sentence: sentence ?? '',
      QuestionNumber: questionNumber,
      Answer: answer ?? '',
      Options: options ?? '',
      UserAnswer: userAnswer ?? '',
      Score: score,
    }
  }

  // Helpers for Sub2/Sub3 mapping which may be reused by normalizeDto
  const mapSubQuestionLocal = (q: any) => ({
    Sentence: (q && typeof q === 'object') ? (q.Sentence ?? q.sentence ?? '') : '',
    Answer: (q && typeof q === 'object') ? (q.Answer ?? q.answer ?? '') : '',
    UserAnswer: readUserVal(q),
    Score: (q && typeof q === 'object' && typeof q.Score === 'number') ? q.Score : 0,
  })

  // If answers already looks like a SubmissionDto, normalize and return it (idempotent)
  const looksLikeDto = (obj: any) => {
    return obj && typeof obj === 'object' && typeof obj.UserId === 'string' && obj.TestId !== undefined && obj.Sub1 && Array.isArray(obj.Sub1.Ex)
  }

  const normalizeDto = (dto: any) => {
    // ensure Sub1.Ex entries have Sentence/QuestionNumber/Answer/Options/UserAnswer/Score
    const subjSub1Def = subject?.Sub1
    if (!dto.Sub1) dto.Sub1 = { Ex: [] }
    if (!Array.isArray(dto.Sub1.Ex)) dto.Sub1.Ex = []
    // If we have subject definitions, prefer them to fill Sentence/Answer/Options
    if (subjSub1Def) {
      if (Array.isArray(subjSub1Def.Ex)) {
        dto.Sub1.Ex = subjSub1Def.Ex.map((defEx: any, idx: number) => {
          const provided = dto.Sub1.Ex[idx]
          return ensureEx(defEx, provided, idx)
        })
      } else {
        const exKeys = Object.keys(subjSub1Def).filter((k: string) => k.startsWith('Ex'))
        dto.Sub1.Ex = exKeys.map((exKey: string, idx: number) => {
          const defEx = subjSub1Def[exKey]
          const provided = dto.Sub1.Ex[idx] ?? dto.Sub1[exKey]
          return ensureEx(defEx, provided, idx)
        })
      }
    } else {
      // No subject def: ensure each entry has the fields
      dto.Sub1.Ex = dto.Sub1.Ex.map((provided: any, idx: number) => ensureEx(undefined, provided, idx))
    }

  // Normalize Sub2 and Sub3 entries ensuring UserAnswer is preserved
  dto.Sub2 = dto.Sub2 ?? {}
  dto.Sub3 = dto.Sub3 ?? {}
  // Ensure Ex1/Ex2/Ex3 exist for Sub2 and Sub3
  dto.Sub2.Ex1 = dto.Sub2.Ex1 ?? {}
  dto.Sub2.Ex2 = dto.Sub2.Ex2 ?? {}
  dto.Sub2.Ex3 = dto.Sub2.Ex3 ?? {}
  dto.Sub3.Ex1 = dto.Sub3.Ex1 ?? {}
  dto.Sub3.Ex2 = dto.Sub3.Ex2 ?? {}
  dto.Sub3.Ex3 = dto.Sub3.Ex3 ?? {}

  // Ensure Sub2.Ex1 parts a/b/c/d are objects and preserve user answers
  dto.Sub2.Ex1.a = mapSubQuestionLocal(dto.Sub2.Ex1.a ?? dto.Sub2.a ?? {})
  dto.Sub2.Ex1.b = mapSubQuestionLocal(dto.Sub2.Ex1.b ?? dto.Sub2.b ?? {})
  dto.Sub2.Ex1.c = mapSubQuestionLocal(dto.Sub2.Ex1.c ?? dto.Sub2.c ?? {})
  dto.Sub2.Ex1.d = mapSubQuestionLocal(dto.Sub2.Ex1.d ?? dto.Sub2.d ?? {})

    // fill missing Sentence/Answer for Sub2/Sub3 using subject when available
    const subjSub2Def = subject?.Sub2
    if (subjSub2Def) {
      const defEx1 = Array.isArray(subjSub2Def?.Ex) ? subjSub2Def.Ex[0] : (subjSub2Def.Ex1 ?? subjSub2Def)
      dto.Sub2.Ex1.Code = dto.Sub2.Ex1.Code ?? defEx1?.Code ?? defEx1?.code ?? ''
      dto.Sub2.Ex1.Sentence = dto.Sub2.Ex1.Sentence ?? defEx1?.Sentence ?? defEx1?.sentence ?? ''
      // handle Ex2/Ex3 when subjSub2Def has array under Ex
      const defEx2 = Array.isArray(subjSub2Def?.Ex) ? subjSub2Def.Ex[1] : subjSub2Def?.Ex2
      const defEx3 = Array.isArray(subjSub2Def?.Ex) ? subjSub2Def.Ex[2] : subjSub2Def?.Ex3
      dto.Sub2.Ex2.Sentence = dto.Sub2.Ex2.Sentence ?? (defEx2?.Sentence ?? defEx2?.sentence ?? '')
      dto.Sub2.Ex3.Sentence = dto.Sub2.Ex3.Sentence ?? (defEx3?.Sentence ?? defEx3?.sentence ?? '')
    }

    const subjSub3Def = subject?.Sub3
    if (subjSub3Def) {
      dto.Sub3.Ex1.Sentence = dto.Sub3.Ex1.Sentence ?? (subjSub3Def?.Ex1?.Sentence ?? subjSub3Def?.Ex1?.sentence ?? '')
      dto.Sub3.Ex2.Sentence = dto.Sub3.Ex2.Sentence ?? (subjSub3Def?.Ex2?.Sentence ?? subjSub3Def?.Ex2?.sentence ?? '')
      dto.Sub3.Ex3.Sentence = dto.Sub3.Ex3.Sentence ?? (subjSub3Def?.Ex3?.Sentence ?? subjSub3Def?.Ex3?.sentence ?? '')
    }

    return dto
  }

  if (looksLikeDto(answers)) {
    return normalizeDto({ ...answers })
  }

  // Build Sub1.Ex (list)
  let sub1Ex: any[] = []
  const subjSub1Def = subject?.Sub1
  if (subjSub1Def) {
    if (Array.isArray(subjSub1Def.Ex)) {
      const defs = subjSub1Def.Ex
      sub1Ex = defs.map((defEx: any, idx: number) => {
        const provided = answers?.Sub1?.Ex && Array.isArray(answers.Sub1.Ex)
          ? answers.Sub1.Ex[idx]
          : (answers?.Sub1 ? (answers.Sub1[`Ex${idx + 1}`] ?? answers.Sub1[idx]) : undefined)
        return ensureEx(defEx, provided, idx)
      })
    } else {
      const exKeys = Object.keys(subjSub1Def).filter((k: string) => k.startsWith('Ex'))
      sub1Ex = exKeys.map((exKey: string, idx: number) => {
        const defEx = subjSub1Def[exKey]
        const provided = answers?.Sub1?.[exKey] ?? answers?.Sub1?.Ex?.[idx]
        return ensureEx(defEx, provided, idx)
      })
    }
  } else {
    // No subject definition: infer from answers
    if (Array.isArray(answers?.Sub1?.Ex)) {
      sub1Ex = answers.Sub1.Ex.map((provided: any, i: number) => ensureEx(undefined, provided, i))
    } else if (Array.isArray(answers?.Sub1)) {
      sub1Ex = answers.Sub1.map((provided: any, i: number) => ensureEx(undefined, provided, i))
    } else if (answers?.Sub1 && typeof answers.Sub1 === 'object') {
      const keys = Object.keys(answers.Sub1).filter(k => /^Ex/i.test(k))
      if (keys.length) sub1Ex = keys.map((k, i) => ensureEx(undefined, answers.Sub1[k], i))
      else {
        const keysAll = Object.keys(answers.Sub1)
        sub1Ex = keysAll.map((k, i) => ensureEx(undefined, answers.Sub1[k], i))
      }
    }
  }

  const sub2Src = answers?.Sub2 ?? {}
  const subjSub2Def = subject?.Sub2
  const buildSub2FromDef = () => {
    const defEx1 = Array.isArray(subjSub2Def?.Ex) ? subjSub2Def.Ex[0] : (subjSub2Def?.Ex1 ?? subjSub2Def)
    return {
      Ex1: {
        Code: defEx1?.Code ?? defEx1?.code ?? '',
        Sentence: defEx1?.Sentence ?? defEx1?.sentence ?? '',
  a: mapSubQuestionLocal(sub2Src?.Ex1?.a ?? sub2Src?.a ?? {}),
  b: mapSubQuestionLocal(sub2Src?.Ex1?.b ?? sub2Src?.b ?? {}),
  c: mapSubQuestionLocal(sub2Src?.Ex1?.c ?? sub2Src?.c ?? {}),
  d: mapSubQuestionLocal(sub2Src?.Ex1?.d ?? sub2Src?.d ?? {}),
      },
      Ex2: {
        Sentence: (Array.isArray(subjSub2Def?.Ex) ? subjSub2Def.Ex[1]?.Sentence ?? subjSub2Def.Ex[1]?.sentence : subjSub2Def?.Ex2?.Sentence ?? subjSub2Def?.Ex2?.sentence) ?? (sub2Src?.Ex2?.Sentence ?? sub2Src?.Ex2?.sentence ?? ''),
        Answer: (Array.isArray(subjSub2Def?.Ex) ? subjSub2Def.Ex[1]?.Answer ?? subjSub2Def.Ex[1]?.answer : subjSub2Def?.Ex2?.Answer ?? subjSub2Def?.Ex2?.answer) ?? (sub2Src?.Ex2?.Answer ?? sub2Src?.Ex2?.answer ?? ''),
        UserAnswer: readUserVal(sub2Src?.Ex2 ?? {}),
        Score: (sub2Src?.Ex2 && typeof sub2Src.Ex2.Score === 'number') ? sub2Src.Ex2.Score : 0,
      },
      Ex3: {
        Sentence: (Array.isArray(subjSub2Def?.Ex) ? subjSub2Def.Ex[2]?.Sentence ?? subjSub2Def.Ex[2]?.sentence : subjSub2Def?.Ex3?.Sentence ?? subjSub2Def?.Ex3?.sentence) ?? (sub2Src?.Ex3?.Sentence ?? sub2Src?.Ex3?.sentence ?? ''),
        Answer: (Array.isArray(subjSub2Def?.Ex) ? subjSub2Def.Ex[2]?.Answer ?? subjSub2Def.Ex[2]?.answer : subjSub2Def?.Ex3?.Answer ?? subjSub2Def?.Ex3?.answer) ?? (sub2Src?.Ex3?.Answer ?? sub2Src?.Ex3?.answer ?? ''),
        UserAnswer: readUserVal(sub2Src?.Ex3 ?? {}),
        Score: (sub2Src?.Ex3 && typeof sub2Src.Ex3.Score === 'number') ? sub2Src.Ex3.Score : 0,
      },
    }
  }

  const Sub2 = subjSub2Def ? buildSub2FromDef() : {
    Ex1: {
      Code: sub2Src?.Ex1?.Code ?? sub2Src?.Ex1?.code ?? '',
      Sentence: sub2Src?.Ex1?.Sentence ?? sub2Src?.Ex1?.sentence ?? '',
  a: mapSubQuestionLocal(sub2Src?.Ex1?.a ?? {}),
  b: mapSubQuestionLocal(sub2Src?.Ex1?.b ?? {}),
  c: mapSubQuestionLocal(sub2Src?.Ex1?.c ?? {}),
  d: mapSubQuestionLocal(sub2Src?.Ex1?.d ?? {}),
    },
  Ex2: { ...mapSubQuestionLocal(sub2Src?.Ex2 ?? {}) },
  Ex3: { ...mapSubQuestionLocal(sub2Src?.Ex3 ?? {}) },
  }

  const sub3Src = answers?.Sub3 ?? {}
  const subjSub3Def = subject?.Sub3
  const buildSub3FromDef = () => ({
    Ex1: {
      Sentence: subjSub3Def?.Ex1?.Sentence ?? subjSub3Def?.Ex1?.sentence ?? (sub3Src?.Ex1?.Sentence ?? sub3Src?.Ex1?.sentence ?? ''),
      Answer: subjSub3Def?.Ex1?.Answer ?? subjSub3Def?.Ex1?.answer ?? (sub3Src?.Ex1?.Answer ?? sub3Src?.Ex1?.answer ?? ''),
      UserAnswer: readUserVal(sub3Src?.Ex1 ?? {}),
      Score: (sub3Src?.Ex1 && typeof sub3Src.Ex1.Score === 'number') ? sub3Src.Ex1.Score : 0,
    },
    Ex2: {
      Sentence: subjSub3Def?.Ex2?.Sentence ?? subjSub3Def?.Ex2?.sentence ?? (sub3Src?.Ex2?.Sentence ?? sub3Src?.Ex2?.sentence ?? ''),
      Answer: subjSub3Def?.Ex2?.Answer ?? subjSub3Def?.Ex2?.answer ?? (sub3Src?.Ex2?.Answer ?? sub3Src?.Ex2?.answer ?? ''),
      UserAnswer: readUserVal(sub3Src?.Ex2 ?? {}),
      Score: (sub3Src?.Ex2 && typeof sub3Src.Ex2.Score === 'number') ? sub3Src.Ex2.Score : 0,
    },
    Ex3: {
      Sentence: subjSub3Def?.Ex3?.Sentence ?? subjSub3Def?.Ex3?.sentence ?? (sub3Src?.Ex3?.Sentence ?? sub3Src?.Ex3?.sentence ?? ''),
      Answer: subjSub3Def?.Ex3?.Answer ?? subjSub3Def?.Ex3?.answer ?? (sub3Src?.Ex3?.Answer ?? sub3Src?.Ex3?.answer ?? ''),
      UserAnswer: readUserVal(sub3Src?.Ex3 ?? {}),
      Score: (sub3Src?.Ex3 && typeof sub3Src.Ex3.Score === 'number') ? sub3Src.Ex3.Score : 0,
    },
  })

  const Sub3 = subjSub3Def ? buildSub3FromDef() : {
  Ex1: { ...mapSubQuestionLocal(sub3Src?.Ex1 ?? {}) },
  Ex2: { ...mapSubQuestionLocal(sub3Src?.Ex2 ?? {}) },
  Ex3: { ...mapSubQuestionLocal(sub3Src?.Ex3 ?? {}) },
  }

  // Ensure Sentences for Sub2 are always taken from the subject definition when available
  // This guarantees the DTO contains the exact sentence text we render in the UI.
  try {
    const subjSub2 = subject?.Sub2
    if (subjSub2) {
      // support array under Ex or keyed Ex1/Ex2/Ex3
      if (Array.isArray(subjSub2.Ex)) {
        const arr = subjSub2.Ex
        Sub2.Ex1.Sentence = Sub2.Ex1.Sentence || (arr[0]?.Sentence ?? arr[0]?.sentence ?? '')
        Sub2.Ex1.Code = Sub2.Ex1.Code || (arr[0]?.Code ?? arr[0]?.code ?? '')
        Sub2.Ex2.Sentence = Sub2.Ex2.Sentence || (arr[1]?.Sentence ?? arr[1]?.sentence ?? '')
        Sub2.Ex3.Sentence = Sub2.Ex3.Sentence || (arr[2]?.Sentence ?? arr[2]?.sentence ?? '')
  // also copy subpart sentences for Ex1 (a/b/c/d)
        Sub2.Ex1.a = Sub2.Ex1.a || {}
        Sub2.Ex1.a.Sentence = Sub2.Ex1.a.Sentence || (arr[0]?.a?.Sentence ?? arr[0]?.a?.sentence ?? '')
        Sub2.Ex1.b = Sub2.Ex1.b || {}
        Sub2.Ex1.b.Sentence = Sub2.Ex1.b.Sentence || (arr[0]?.b?.Sentence ?? arr[0]?.b?.sentence ?? '')
        Sub2.Ex1.c = Sub2.Ex1.c || {}
        Sub2.Ex1.c.Sentence = Sub2.Ex1.c.Sentence || (arr[0]?.c?.Sentence ?? arr[0]?.c?.sentence ?? '')
        Sub2.Ex1.d = Sub2.Ex1.d || {}
        Sub2.Ex1.d.Sentence = Sub2.Ex1.d.Sentence || (arr[0]?.d?.Sentence ?? arr[0]?.d?.sentence ?? '')
        // copy Answer fields for subparts from subject def if missing
        Sub2.Ex1.a.Answer = Sub2.Ex1.a.Answer || (arr[0]?.a?.Answer ?? arr[0]?.a?.answer ?? '')
        Sub2.Ex1.b.Answer = Sub2.Ex1.b.Answer || (arr[0]?.b?.Answer ?? arr[0]?.b?.answer ?? '')
        Sub2.Ex1.c.Answer = Sub2.Ex1.c.Answer || (arr[0]?.c?.Answer ?? arr[0]?.c?.answer ?? '')
        Sub2.Ex1.d.Answer = Sub2.Ex1.d.Answer || (arr[0]?.d?.Answer ?? arr[0]?.d?.answer ?? '')
        // copy Answer for Ex2/Ex3
        Sub2.Ex2.Answer = Sub2.Ex2.Answer || (arr[1]?.Answer ?? arr[1]?.answer ?? '')
        Sub2.Ex3.Answer = Sub2.Ex3.Answer || (arr[2]?.Answer ?? arr[2]?.answer ?? '')
      } else {
        Sub2.Ex1.Sentence = Sub2.Ex1.Sentence || (subjSub2.Ex1?.Sentence ?? subjSub2.Ex1?.sentence ?? subjSub2?.Sentence ?? subjSub2?.sentence ?? '')
        Sub2.Ex1.Code = Sub2.Ex1.Code || (subjSub2.Ex1?.Code ?? subjSub2.Ex1?.code ?? subjSub2?.Code ?? subjSub2?.code ?? '')
        Sub2.Ex2.Sentence = Sub2.Ex2.Sentence || (subjSub2.Ex2?.Sentence ?? subjSub2.Ex2?.sentence ?? '')
        Sub2.Ex3.Sentence = Sub2.Ex3.Sentence || (subjSub2.Ex3?.Sentence ?? subjSub2.Ex3?.sentence ?? '')
        // copy subpart sentences for Ex1 (a/b/c/d)
        Sub2.Ex1.a = Sub2.Ex1.a || {}
        Sub2.Ex1.a.Sentence = Sub2.Ex1.a.Sentence || (subjSub2.Ex1?.a?.Sentence ?? subjSub2.Ex1?.a?.sentence ?? '')
        Sub2.Ex1.b = Sub2.Ex1.b || {}
        Sub2.Ex1.b.Sentence = Sub2.Ex1.b.Sentence || (subjSub2.Ex1?.b?.Sentence ?? subjSub2.Ex1?.b?.sentence ?? '')
        Sub2.Ex1.c = Sub2.Ex1.c || {}
        Sub2.Ex1.c.Sentence = Sub2.Ex1.c.Sentence || (subjSub2.Ex1?.c?.Sentence ?? subjSub2.Ex1?.c?.sentence ?? '')
        Sub2.Ex1.d = Sub2.Ex1.d || {}
        Sub2.Ex1.d.Sentence = Sub2.Ex1.d.Sentence || (subjSub2.Ex1?.d?.Sentence ?? subjSub2.Ex1?.d?.sentence ?? '')
        // copy Answer fields for subparts from subject def if missing
        Sub2.Ex1.a.Answer = Sub2.Ex1.a.Answer || (subjSub2.Ex1?.a?.Answer ?? subjSub2.Ex1?.a?.answer ?? '')
        Sub2.Ex1.b.Answer = Sub2.Ex1.b.Answer || (subjSub2.Ex1?.b?.Answer ?? subjSub2.Ex1?.b?.answer ?? '')
        Sub2.Ex1.c.Answer = Sub2.Ex1.c.Answer || (subjSub2.Ex1?.c?.Answer ?? subjSub2.Ex1?.c?.answer ?? '')
        Sub2.Ex1.d.Answer = Sub2.Ex1.d.Answer || (subjSub2.Ex1?.d?.Answer ?? subjSub2.Ex1?.d?.answer ?? '')
        // copy Answer for Ex2/Ex3
        Sub2.Ex2.Answer = Sub2.Ex2.Answer || (subjSub2.Ex2?.Answer ?? subjSub2.Ex2?.answer ?? '')
        Sub2.Ex3.Answer = Sub2.Ex3.Answer || (subjSub2.Ex3?.Answer ?? subjSub2.Ex3?.answer ?? '')
      }
    }
  } catch (e) {
    // swallow - defensive
  }

  const payload = {
    // Id intentionally omitted (backend generates it). keep property name casing same as DTO.
    UserId,
    TestId: testId,
    Sub1: { Ex: sub1Ex },
    Sub2,
    Sub3,
  }

  return payload
}