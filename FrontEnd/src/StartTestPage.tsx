
import { useState, useEffect } from 'react'
import Header from './Header'
import type { SubjectData } from './interfaces/SubjectData'
import { submitTestAnswers, transformAnswersToApiFormat } from './utils/submissionApi'
import { firstSubjectChecker } from './services/checkers/firstSubjectChecker'

interface StartTestPageProps {
	subject: SubjectData
	onNavigateBack: () => void
	userId?: string // Optional user ID, defaults to empty string
	onSubmit?: (answers: any) => void
}

// The page renders the subject and a form to collect the user's answers.
// For Sub1 we render radio options (a/b/c/d) extracted from `Options`.
// For Sub2 and Sub3 we render text inputs / textareas for free text answers.
function StartTestPage({ subject, onNavigateBack, onSubmit, userId = '' }: StartTestPageProps) {

	const getStorageKey = () => {
		const subjectId = subject.id || `${subject.anScolar}-${subject.sesiune}`
		return `test-progress-${subjectId}`
	}

	const getTimerKey = () => {
		const subjectId = subject.id || `${subject.anScolar}-${subject.sesiune}`
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

	const handleAutoSubmit = async () => {
		console.log('Time expired! Auto-submitting...')

		// Transform answers to API format (includes UserId and TestId)
	const transformedAnswers = transformAnswersToApiFormat(subject, formState, userId)
	const checkedAnswers = firstSubjectChecker(transformedAnswers)
		console.log('Auto-submit - Transformed answers:', transformedAnswers)

		// Submit to API
		const result = await submitTestAnswers(checkedAnswers)

		// Clear localStorage regardless of success
		const storageKey = getStorageKey()
		const timerKey = getTimerKey()
		localStorage.removeItem(storageKey)
		localStorage.removeItem(timerKey)

	if (result.success) {
			console.log('Auto-submission successful!')
			// pass the checked answers so the caller can render scores/highlights
			if (onSubmit) onSubmit(checkedAnswers)
			alert('Timpul a expirat! Testul a fost trimis automat.')
		} else {
			console.error('Auto-submission failed:', result.message)
			alert(`Timpul a expirat! Eroare la trimiterea testului: ${result.message}`)
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
			sub1: {
				...(prev.sub1 || {}),
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

	const submit = async (e: React.FormEvent) => {
		e.preventDefault()

		console.log('Form state before transformation:', formState)

		// Transform answers to API format (includes UserId and TestId)
	const transformedAnswers = transformAnswersToApiFormat(subject, formState, userId)
	const checkedAnswers = firstSubjectChecker(transformedAnswers)
		console.log('Transformed answers:', checkedAnswers)

		// Submit to API
		const result = await submitTestAnswers(checkedAnswers)

		if (result.success) {
			console.log('Submission successful!')

			// Clear localStorage after successful submission
			const storageKey = getStorageKey()
			const timerKey = getTimerKey()
			localStorage.removeItem(storageKey)
			localStorage.removeItem(timerKey)

			// Call the onSubmit callback if provided with the checked answers
			if (onSubmit) onSubmit(checkedAnswers)

			// Show success message
			alert('Test trimis cu succes!')
		} else {
			console.error('Submission failed:', result.message)
			alert(`Eroare la trimiterea testului: ${result.message}`)
		}
	}

	const renderSub1 = (sub: any) => {
		if (!sub) return null

		// Support two data shapes:
		// 1) keyed exercises: { ex1: {...}, ex2: {...} }
		// 2) array under 'ex': { ex: [ {...}, {...} ] }
		if (Array.isArray(sub.ex)) {
			return (
				<div className="space-y-6">
					{sub.ex.map((item: any, idx: number) => {
						const exKey = `ex${idx + 1}`
						const ex = item
						const options = ex?.options ? String(ex.options).split('$') : []
						return (
							<div key={exKey} className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
								<h3 className="text-lg font-semibold mb-2">{`Exercițiul ${idx + 1}`}</h3>
								{ex.sentence && <p className="text-sm text-gray-700 mb-3">{ex.sentence}</p>}

								<div className="ml-4 space-y-2">
									{options.map((opt: string, optIdx: number) => {
										const letter = String.fromCharCode(97 + optIdx)
										return (
											<label key={optIdx} className="flex items-center gap-3 text-sm text-gray-700">
												<input
													type="radio"
													name={`sub1-${exKey}`}
													value={letter}
													checked={formState.sub1?.[exKey] === letter}
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

		const exercises = Object.keys(sub).filter(k => k.startsWith('ex'))
		return (
			<div className="space-y-6">
				{exercises.map(exKey => {
					const ex = sub[exKey]
					if (!ex) return null

					const options = ex.options ? String(ex.options).split('$') : []

					return (
						<div key={exKey} className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
							<h3 className="text-lg font-semibold mb-2">{`Exercițiul ${exKey.replace('ex', '')}`}</h3>
							{ex.sentence && <p className="text-sm text-gray-700 mb-3">{ex.sentence}</p>}

							<div className="ml-4 space-y-2">
								{options.map((opt: string, idx: number) => {
									const letter = String.fromCharCode(97 + idx) // a, b, c, d
									return (
										<label key={idx} className="flex items-center gap-3 text-sm text-gray-700">
											<input
												type="radio"
												name={`sub1-${exKey}`}
												value={letter}
												checked={formState.sub1?.[exKey] === letter}
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

		// Support array under 'ex' or keyed ex1/ex2
		if (Array.isArray(sub.ex)) {
			return (
				<div className="space-y-6">
					{sub.ex.map((item: any, idx: number) => {
						const exKey = `ex${idx + 1}`
						const ex = item
						if (!ex) return null
						const hasParts = ex.a || ex.b || ex.c || ex.d
						return (
							<div key={exKey} className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
								<h3 className="text-lg font-semibold mb-2">{`Exercițiul ${idx + 1}`}</h3>
								{ex.sentence && <p className="text-sm text-gray-700 mb-3">{ex.sentence}</p>}
								{ex.code && (
									<pre className="bg-gray-100 p-3 rounded mb-3 text-sm overflow-x-auto">{ex.code}</pre>
								)}
								<div className="ml-4 space-y-3">
									{hasParts ? (
										['a', 'b', 'c', 'd'].map(part =>
											ex[part] ? (
											<div key={part}>
												<label className="block text-sm font-medium text-gray-700 mb-1">{`(${part}) ${ex[part].sentence || ''}`}</label>
												{subKey === 'sub2' && (part === 'c' || part === 'd') ? (
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

		const exercises = Object.keys(sub).filter(k => k.startsWith('ex'))
		return (
			<div className="space-y-6">
				{exercises.map(exKey => {
					const ex = sub[exKey]
					if (!ex) return null

					// If exercise has subparts a/b/c/d, show one input per subpart
					const hasParts = ex.a || ex.b || ex.c || ex.d

					return (
						<div key={exKey} className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
							<h3 className="text-lg font-semibold mb-2">{`Exercițiul ${exKey.replace('ex', '')}`}</h3>
							{ex.sentence && <p className="text-sm text-gray-700 mb-3">{ex.sentence}</p>}
							{ex.code && (
								<pre className="bg-gray-100 p-3 rounded mb-3 text-sm overflow-x-auto">{ex.code}</pre>
							)}

							<div className="ml-4 space-y-3">
								{hasParts ? (
									['a', 'b', 'c', 'd'].map(part =>
										ex[part] ? (
										<div key={part}>
											<label className="block text-sm font-medium text-gray-700 mb-1">{`(${part}) ${ex[part].sentence || ''}`}</label>
											{subKey === 'sub2' && (part === 'c' || part === 'd') ? (
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
			<Header showLoginButton={false} />

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
					Completează testul — {subject.anScolar} · {subject.sesiune}
				</h1>

				{/* Timer */}
				<div className="mb-8 flex justify-center">
					<div className={`px-6 py-3 rounded-xl font-bold text-2xl ${
						timeRemaining < 600 ? 'bg-red-100 text-red-700' : 
						timeRemaining < 1800 ? 'bg-yellow-100 text-yellow-700' : 
						'bg-blue-100 text-blue-700'
					}`}>
						⏱️ Timp rămas: {formatTime(timeRemaining)}
					</div>
				</div>

				<form onSubmit={submit} className="space-y-8">
					<section>
						<h2 className="text-2xl font-bold mb-4">Subiectul 1</h2>
						{renderSub1(subject.sub1)}
					</section>

					<section>
						<h2 className="text-2xl font-bold mb-4">Subiectul 2</h2>
						{renderSub2or3('sub2', subject.sub2)}
					</section>

					<section>
						<h2 className="text-2xl font-bold mb-4">Subiectul 3</h2>
						{renderSub2or3('sub3', subject.sub3)}
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
