
import { useState, useEffect } from 'react'
import Header from './Header'
import type { SubjectData } from './interfaces/SubjectData'
import { TextWithNewlines, CodeWithNewlines } from './utils/TextWithNewlines'

interface StartTestPageProps {
	subject: SubjectData
	onNavigateBack: () => void
	onNavigateToLanding?: () => void
	onSubmit?: (answers: any) => void
}

// The page renders the subject and a form to collect the user's answers.
// For Sub1 we render radio options (a/b/c/d) extracted from `Options`.
// For Sub2 and Sub3 we render text inputs / textareas for free text answers.

function StartTestPage({ subject, onNavigateBack, onNavigateToLanding, onSubmit }: StartTestPageProps) {
	
	const getStorageKey = () => {
		const subjectId = subject._id?.$oid || `${subject.AnScolar}-${subject.Sesiune}`
		return `test-progress-${subjectId}`
	}

	const getTimerKey = () => {
		const subjectId = subject._id?.$oid || `${subject.AnScolar}-${subject.Sesiune}`
		return `test-timer-${subjectId}`
	}

	const [formState, setFormState] = useState<Record<string, any>>(() => {
		// Restore from localStorage on mount
		const storageKey = getStorageKey()
		const saved = localStorage.getItem(storageKey)
		return saved ? JSON.parse(saved) : {}
	})

	const [timeRemaining, setTimeRemaining] = useState<number>(() => {
		// Restore timer from localStorage or start with 3 hours (10800 seconds)
		const timerKey = getTimerKey()
		const savedTime = localStorage.getItem(timerKey)
		if (savedTime) {
			const savedData = JSON.parse(savedTime)
			const elapsed = Math.floor((Date.now() - savedData.startTime) / 1000)
			const remaining = savedData.duration - elapsed
			return remaining > 0 ? remaining : 0
		}
		// Initialize with 3 hours
		const duration = 3 * 60 * 60 // 10800 seconds
		localStorage.setItem(timerKey, JSON.stringify({ startTime: Date.now(), duration }))
		return duration
	})

	// Save to localStorage whenever formState changes
	useEffect(() => {
		const storageKey = getStorageKey()
		localStorage.setItem(storageKey, JSON.stringify(formState))
	}, [formState])

	// Timer countdown
	useEffect(() => {
		if (timeRemaining <= 0) {
			// Auto-submit when time runs out
			handleAutoSubmit()
			return
		}

		const interval = setInterval(() => {
			setTimeRemaining(prev => {
				const newTime = prev - 1
				if (newTime <= 0) {
					clearInterval(interval)
					return 0
				}
				return newTime
			})
		}, 1000)

		return () => clearInterval(interval)
	}, [timeRemaining])

	const handleAutoSubmit = () => {
		const answers: any = { ...formState }
		const storageKey = getStorageKey()
		const timerKey = getTimerKey()
		localStorage.removeItem(storageKey)
		localStorage.removeItem(timerKey)

		if (onSubmit) onSubmit(answers)
		else console.log('Auto-submitted answers (time expired)', answers)
	}

	const handleCancelTest = () => {
		if (window.confirm('Sigur vrei să anulezi testul? Tot progresul va fi pierdut.')) {
			const storageKey = getStorageKey()
			const timerKey = getTimerKey()
			localStorage.removeItem(storageKey)
			localStorage.removeItem(timerKey)
			onNavigateBack()
		}
	}

	const formatTime = (seconds: number) => {
		const hours = Math.floor(seconds / 3600)
		const minutes = Math.floor((seconds % 3600) / 60)
		const secs = seconds % 60
		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
	}


	const handleSub1Change = (exerciseKey: string, value: string) => {
		setFormState(prev => ({
			...prev,
			Sub1: {
				...(prev.Sub1 || {}),
				[exerciseKey]: value,
			},
		}))
	}

	const handleTextChange = (subjectKey: string, exerciseKey: string, field: string | null, value: string) => {
		setFormState(prev => {
			const subjectPart = prev[subjectKey] ? { ...prev[subjectKey] } : {}
			if (field) {
				subjectPart[exerciseKey] = {
					...(subjectPart[exerciseKey] || {}),
					[field]: value,
				}
			} else {
				subjectPart[exerciseKey] = value
			}

			return { ...prev, [subjectKey]: subjectPart }
		})
	}

	const submit = (e: React.FormEvent) => {
		e.preventDefault()
		const answers: any = { ...formState }

		// Clear localStorage after submission
		const storageKey = getStorageKey()
		const timerKey = getTimerKey()
		localStorage.removeItem(storageKey)
		localStorage.removeItem(timerKey)

		// Optionally map into the project's `UserAnswer` shape if desired.
		if (onSubmit) onSubmit(answers)
		else console.log('Submitted answers', answers)
	}

	const renderSub1 = (sub: any) => {
		if (!sub) return null

		// Support two data shapes:
		// 1) keyed exercises: { Ex1: {...}, Ex2: {...} }
		// 2) array under 'Ex': { Ex: [ {...}, {...} ] }
		if (Array.isArray(sub.Ex)) {
			return (
				<div className="space-y-6">
					{sub.Ex.map((item: any, idx: number) => {
						const exKey = `Ex${idx + 1}`
					const ex = item
					const options = ex?.Options ? String(ex.Options).split('$') : []
					return (
						<div key={exKey} className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
							<h3 className="text-lg font-semibold mb-2">{`Exercițiul ${idx + 1}`}</h3>
							{ex.Sentence && <TextWithNewlines text={ex.Sentence} className="text-sm text-gray-700 mb-3" />}

								<div className="ml-4 space-y-2">
									{options.map((opt: string, optIdx: number) => {
										const letter = String.fromCharCode(97 + optIdx)
										return (
											<label key={optIdx} className="flex items-center gap-3 text-sm text-gray-700">
												<input
													type="radio"
													name={`sub1-${exKey}`}
													value={letter}
													checked={formState.Sub1?.[exKey] === letter}
													onChange={(e) => handleSub1Change(exKey, e.target.value)}
													className="w-4 h-4"
												/>
												<span className="font-bold">{letter}.</span>
												<span className="text-gray-600">{opt}</span>
											</label>
										)
									})}
								</div>
							</div>
						)
					})}
				</div>
			)
		}

	const exercises = Object.keys(sub).filter(k => k.startsWith('Ex'))
	return (
		<div className="space-y-6">
			{exercises.map(exKey => {
				const ex = sub[exKey]
				if (!ex) return null

				const options = ex.Options ? String(ex.Options).split('$') : []

				return (
					<div key={exKey} className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
						<h3 className="text-lg font-semibold mb-2">{`Exercițiul ${exKey.replace('Ex', '')}`}</h3>
						{ex.Sentence && <TextWithNewlines text={ex.Sentence} className="text-sm text-gray-700 mb-3" />}

							<div className="ml-4 space-y-2">
								{options.map((opt: string, idx: number) => {
									const letter = String.fromCharCode(97 + idx) // a, b, c, d
									return (
										<label key={idx} className="flex items-center gap-3 text-sm text-gray-700">
											<input
												type="radio"
												name={`sub1-${exKey}`}
												value={letter}
												checked={formState.Sub1?.[exKey] === letter}
												onChange={(e) => handleSub1Change(exKey, e.target.value)}
												className="w-4 h-4"
											/>
											<span className="font-bold">{letter}.</span>
											<span className="text-gray-600">{opt}</span>
											</label>
									)
								})}
							</div>
						</div>
					)
				})}
			</div>
		)
	}

	const renderSub2or3 = (subKey: string, sub: any) => {
		if (!sub) return null

		// Support array under 'Ex' or keyed Ex1/Ex2
		if (Array.isArray(sub.Ex)) {
			return (
				<div className="space-y-6">
					{sub.Ex.map((item: any, idx: number) => {
						const exKey = `Ex${idx + 1}`
						const ex = item
						if (!ex) return null
						const hasParts = ex.a || ex.b || ex.c || ex.d
						return (
					<div key={exKey} className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
					<h3 className="text-lg font-semibold mb-2">{`Exercițiul ${idx + 1}`}</h3>
					{ex.Sentence && <TextWithNewlines text={ex.Sentence} className="text-sm text-gray-700 mb-3" />}
					<CodeWithNewlines code={ex.Code} />
					<div className="ml-4 space-y-3">
							{hasParts ? (
								['a', 'b', 'c', 'd'].map(part =>
									ex[part] ? (
									<div key={part}>
										<label className="block text-sm font-medium text-gray-700 mb-1">{`(${part}) ${ex[part].Sentence || ''}`}</label>
												{subKey === 'Sub2' && (part === 'c' || part === 'd') ? (
													<textarea
														rows={3}
														value={formState[subKey]?.[exKey]?.[part] || ''}
														onChange={(e) => handleTextChange(subKey, exKey, part, e.target.value)}
														className="w-full px-3 py-2 border rounded-lg"
													/>
												) : (
													<input
														type="text"
														value={formState[subKey]?.[exKey]?.[part] || ''}
														onChange={(e) => handleTextChange(subKey, exKey, part, e.target.value)}
														className="w-full px-3 py-2 border rounded-lg"
													/>
												)}
											</div>
										) : null
										)
									) : (
									<textarea
										rows={3}
										value={formState[subKey]?.[exKey] || ''}
										onChange={(e) => handleTextChange(subKey, exKey, null, e.target.value)}
										className="w-full px-3 py-2 border rounded-lg"
									/>
									)}
								</div>
							</div>
						)
					})}
				</div>
			)
		}

		const exercises = Object.keys(sub).filter(k => k.startsWith('Ex'))
		return (
			<div className="space-y-6">
				{exercises.map(exKey => {
					const ex = sub[exKey]
					if (!ex) return null

					// If exercise has subparts a/b/c/d, show one input per subpart
					const hasParts = ex.a || ex.b || ex.c || ex.d

		return (
			<div key={exKey} className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
				<h3 className="text-lg font-semibold mb-2">{`Exercițiul ${exKey.replace('Ex', '')}`}</h3>
				{ex.Sentence && <TextWithNewlines text={ex.Sentence} className="text-sm text-gray-700 mb-3" />}
				<CodeWithNewlines code={ex.Code} />

				<div className="ml-4 space-y-3">
						{hasParts ? (
							['a', 'b', 'c', 'd'].map(part =>
								ex[part] ? (
								<div key={part}>
											{subKey === 'Sub2' && (part === 'c' || part === 'd') ? (
												<textarea
													rows={3}
													value={formState[subKey]?.[exKey]?.[part] || ''}
													onChange={(e) => handleTextChange(subKey, exKey, part, e.target.value)}
													className="w-full px-3 py-2 border rounded-lg"
												/>
											) : (
												<input
													type="text"
													value={formState[subKey]?.[exKey]?.[part] || ''}
													onChange={(e) => handleTextChange(subKey, exKey, part, e.target.value)}
													className="w-full px-3 py-2 border rounded-lg"
												/>
											)}
											</div>
										) : null
										)
									) : (
									<textarea
										rows={3}
										value={formState[subKey]?.[exKey] || ''}
										onChange={(e) => handleTextChange(subKey, exKey, null, e.target.value)}
										className="w-full px-3 py-2 border rounded-lg"
									/>
									)}
							</div>
						</div>
					)
				})}
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
			<Header showLoginButton={false} onNavigateToLanding={onNavigateToLanding} />

			<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<button
					onClick={onNavigateBack}
					className="mb-6 flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
				>
					<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
					</svg>
					Înapoi la detalii
				</button>

				<h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
					Completează testul — {subject.AnScolar} · {subject.Sesiune}
				</h1>

				{/* Timer and Cancel Button */}
				<div className="mb-8 flex justify-center items-center gap-4">
					<div className={`px-6 py-3 rounded-xl font-bold text-xl ${
						timeRemaining < 600 ? 'bg-red-100 text-red-700' : 
						timeRemaining < 1800 ? 'bg-yellow-100 text-yellow-700' : 
						'bg-blue-100 text-blue-700'
					}`}>
						Timp rămas: {formatTime(timeRemaining)}
					</div>
					<button
						type="button"
						onClick={handleCancelTest}
						className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold text-xl hover:bg-red-700 transition-colors"
					>
						Anulare Test
					</button>
				</div>

				<form onSubmit={submit} className="space-y-8">
					<section>
						<h2 className="text-2xl font-bold mb-4">Subiectul 1</h2>
						{renderSub1(subject.Sub1)}
					</section>

					<section>
						<h2 className="text-2xl font-bold mb-4">Subiectul 2</h2>
						{renderSub2or3('Sub2', subject.Sub2)}
					</section>

					<section>
						<h2 className="text-2xl font-bold mb-4">Subiectul 3</h2>
						{renderSub2or3('Sub3', subject.Sub3)}
					</section>

					<div className="flex items-center gap-4">
						<button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold">
							Trimite răspunsurile
						</button>

						<button type="button" onClick={() => console.log('Preview answers', formState)} className="text-sm text-gray-600">
							Preview answers
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}

export default StartTestPage
