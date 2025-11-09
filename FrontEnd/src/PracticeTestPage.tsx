import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from './Header'
import type { SubjectData } from './interfaces/SubjectData'
import { generateExplanation, generatePseudocodeInterpreter, type ExerciseContext } from './utils/openaiHelper'
import { getSubjectId } from './utils/subjectLoader'
import { submitTestAnswers, transformAnswersToApiFormat } from './utils/submissionApi'

interface PracticeTestPageProps {
	subject: SubjectData
	onNavigateBack: () => void
	userId?: string // Optional user ID, defaults to empty string
	onSubmit?: (answers: any) => void
}

function PracticeTestPage({ subject, onNavigateBack, onSubmit, userId = '' }: PracticeTestPageProps) {
	const navigate = useNavigate()
	const [showExplanation, setShowExplanation] = useState<string | null>(null)
	const [explanationText, setExplanationText] = useState<string>('')
	const [loadingExplanation, setLoadingExplanation] = useState<boolean>(false)
	const [explanationPosition, setExplanationPosition] = useState<{ top: number; left: number } | null>(null)

	const getStorageKey = () => {
		const subjectId = subject.id || `${subject.anScolar}-${subject.sesiune}`
		return `practice-progress-${subjectId}`
	}

	const [formState, setFormState] = useState<Record<string, any>>(() => {
		// Restore from localStorage on mount
		const storageKey = getStorageKey()
		const saved = localStorage.getItem(storageKey)
		return saved ? JSON.parse(saved) : {}
	})

	// Save to localStorage whenever formState changes
	useEffect(() => {
		const storageKey = getStorageKey()
		localStorage.setItem(storageKey, JSON.stringify(formState))
	}, [formState])

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
		console.log('Transformed answers:', transformedAnswers)

		// Submit to API
		const result = await submitTestAnswers(transformedAnswers)

		if (result.success) {
			console.log('Practice test submission successful!')

			// Clear localStorage after successful submission
			const storageKey = getStorageKey()
			localStorage.removeItem(storageKey)

			// Call the onSubmit callback if provided
			if (onSubmit) onSubmit(transformedAnswers)

			// Show success message
			alert('Răspunsurile tale au fost trimise cu succes!')
		} else {
			console.error('Practice test submission failed:', result.message)
			alert(`Eroare la trimiterea răspunsurilor: ${result.message}`)
		}
	}

	const showExplanationPopup = async (subjectKey: string, exerciseKey: string, event?: React.MouseEvent<HTMLButtonElement>) => {
		// Close if clicking the same button again
		const key = `${subjectKey}-${exerciseKey}`
		if (showExplanation === key) {
			closeExplanationPopup()
			return
		}

		setShowExplanation(key)
		setLoadingExplanation(true)
		setExplanationText('')

		// Get button position for positioning the dialog
		if (event) {
			const button = event.currentTarget
			const rect = button.getBoundingClientRect()
			setExplanationPosition({
				top: rect.bottom + window.scrollY,
				left: rect.left + window.scrollX
			})
		}

		try {
			// Parse the exercise key
			const parts = exerciseKey.split('-')
			const exKey = parts[0] // ex1, ex2, etc.
			const subpoint = parts[1] // a, b, c, d (if exists)
			const isInterpreter = parts[2] === 'interpreter'

			// Get exercise data
			let exerciseData: any
			let exerciseNumber: number

			if (subjectKey === 'sub1') {
				const sub = subject[subjectKey]
				if (Array.isArray(sub?.ex)) {
					const idx = parseInt(exKey.replace('ex', '')) - 1
					exerciseData = sub.ex[idx]
					exerciseNumber = idx + 1
				} else {
                                        // @ts-ignore
					exerciseData = sub?.[exKey]
					exerciseNumber = parseInt(exKey.replace('ex', ''))
				}
			} else {
				const sub = subject[subjectKey]
				if (Array.isArray(sub?.ex)) {
					const idx = parseInt(exKey.replace('ex', '')) - 1
					exerciseData = sub.ex[idx]
					exerciseNumber = idx + 1
				} else {
					exerciseData = sub?.[exKey]
					exerciseNumber = parseInt(exKey.replace('ex', ''))
				}
			}

			// Get user answer
			let userAnswer: string | Record<string, string> | undefined

			if (subjectKey === 'sub1') {
				userAnswer = formState.sub1?.[exKey]
			} else if (subpoint) {
				userAnswer = formState[subjectKey]?.[exKey]?.[subpoint]
			} else {
				userAnswer = formState[subjectKey]?.[exKey]
			}

			const context: ExerciseContext = {
				subject: subjectKey,
				exerciseNumber,
				exerciseData,
				userAnswer,
				subpoint
			}

			let explanation: string
			if (isInterpreter) {
				explanation = await generatePseudocodeInterpreter(context)
			} else {
				explanation = await generateExplanation(context)
			}

			setExplanationText(explanation)
		} catch (error) {
			console.error('Error generating explanation:', error)
			setExplanationText('Eroare la generarea explicației. Vă rugăm încercați din nou.')
		} finally {
			setLoadingExplanation(false)
		}
	}

	const closeExplanationPopup = () => {
		setShowExplanation(null)
		setExplanationText('')
		setExplanationPosition(null)
	}

	const renderSub1 = (sub: any) => {
		if (!sub) return null

		if (Array.isArray(sub.ex)) {
			return (
				<div className="space-y-6">
					{sub.ex.map((item: any, idx: number) => {
						const exKey = `ex${idx + 1}`
						const ex = item
						const options = ex?.options ? String(ex.options).split('$') : []
						return (
							<div key={exKey} className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
								<div className="flex justify-between items-start mb-2">
									<h3 className="text-lg font-semibold">{`Exercițiul ${idx + 1}`}</h3>
									<button
										type="button"
										onClick={(e) => showExplanationPopup('sub1', exKey, e)}
										className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
											showExplanation === `sub1-${exKey}` 
												? 'bg-green-600 text-white' 
												: 'bg-green-500 hover:bg-green-600 text-white'
										}`}
									>
										💡 Explicație
									</button>
								</div>
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
							<div className="flex justify-between items-start mb-2">
								<h3 className="text-lg font-semibold">{`Exercițiul ${exKey.replace('ex', '')}`}</h3>
								<button
									type="button"
									onClick={(e) => showExplanationPopup('sub1', exKey, e)}
									className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
										showExplanation === `sub1-${exKey}` 
											? 'bg-green-600 text-white' 
											: 'bg-green-500 hover:bg-green-600 text-white'
									}`}
								>
									💡 Explicație
								</button>
							</div>
							{ex.sentence && <p className="text-sm text-gray-700 mb-3">{ex.sentence}</p>}

							<div className="ml-4 space-y-2">
								{options.map((opt: string, idx: number) => {
									const letter = String.fromCharCode(97 + idx)
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

		if (Array.isArray(sub.ex)) {
			return (
				<div className="space-y-6">
					{sub.ex.map((item: any, idx: number) => {
						const exKey = `ex${idx + 1}`
						const ex = item
						if (!ex) return null
						const hasParts = ex.a || ex.b || ex.c || ex.d
						const isSub2Ex1 = subKey === 'sub2' && exKey === 'ex1'
						return (
							<div key={exKey} className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
								<div className="flex justify-between items-start mb-2">
									<h3 className="text-lg font-semibold">{`Exercițiul ${idx + 1}`}</h3>
									{isSub2Ex1 ? (
										<button
											type="button"
											onClick={() => navigate(`/interpretor/${getSubjectId(subject)}`)}
											className="px-3 py-1 rounded-lg text-sm font-medium transition-colors bg-purple-500 hover:bg-purple-600 text-white"
										>
											🔧 Deschide interpretorul de pseudocod
										</button>
									) : (
										<button
											type="button"
											onClick={(e) => showExplanationPopup(subKey, exKey, e)}
											className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
												showExplanation === `${subKey}-${exKey}` 
													? 'bg-green-600 text-white'
													: 'bg-green-500 hover:bg-green-600 text-white'
											}`}
										>
											💡 Explicație
										</button>
									)}
								</div>
								{ex.sentence && <p className="text-sm text-gray-700 mb-3">{ex.sentence}</p>}
								{ex.code && (
									<pre className="bg-gray-100 p-4 rounded-lg mb-3 text-sm overflow-x-auto">
										<code>{ex.code}</code>
									</pre>
								)}
								<div className="ml-4 space-y-3">
									{hasParts ? (
										['a', 'b', 'c', 'd'].map(part =>
											ex[part] ? (
												<div key={part}>
													<div className="flex justify-between items-start mb-1">
														<label className="block text-sm font-medium text-gray-700">{`(${part}) ${ex[part].sentence || ''}`}</label>
													</div>
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

					const hasParts = ex.a || ex.b || ex.c || ex.d
					const isSub2Ex1 = subKey === 'sub2' && exKey === 'ex1'

					return (
						<div key={exKey} className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
							<div className="flex justify-between items-start mb-2">
								<h3 className="text-lg font-semibold">{`Exercițiul ${exKey.replace('ex', '')}`}</h3>
								{isSub2Ex1 ? (
									<button
										type="button"
										onClick={() => navigate(`/interpretor/${getSubjectId(subject)}`)}
										className="px-3 py-1 rounded-lg text-sm font-medium transition-colors bg-purple-500 hover:bg-purple-600 text-white"
									>
										🔧 Deschide interpretorul de pseudocod
									</button>
								) : (
									<button
										type="button"
										onClick={(e) => showExplanationPopup(subKey, exKey, e)}
										className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
											showExplanation === `${subKey}-${exKey}`
												? 'bg-green-600 text-white'
												: 'bg-green-500 hover:bg-green-600 text-white'
										}`}
									>
										💡 Explicație
									</button>
								)}
							</div>
							{ex.sentence && <p className="text-sm text-gray-700 mb-3">{ex.sentence}</p>}
							{ex.code && (
								<pre className="bg-gray-100 p-4 rounded-lg mb-3 text-sm overflow-x-auto">
									<code>{ex.code}</code>
								</pre>
							)}

							<div className="ml-4 space-y-3">
								{hasParts ? (
									['a', 'b', 'c', 'd'].map(part =>
										ex[part] ? (
											<div key={part}>
												<div className="flex justify-between items-start mb-1">
													<label className="block text-sm font-medium text-gray-700">{`(${part}) ${ex[part].sentence || ''}`}</label>
												</div>
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

			{/* Explanation Dialog Container */}
			{showExplanation && (
				<>
					{/* Backdrop to close on outside click */}
					<div
						className="fixed inset-0 z-40"
						onClick={closeExplanationPopup}
					/>
					{/* Dialog Container */}
					<div
						className="fixed z-50 w-full max-w-2xl"
						style={{
							top: `${explanationPosition?.top || 0}px`,
							left: `${Math.min(explanationPosition?.left || 0, window.innerWidth - 700)}px`,
						}}
					>
						<div className="mt-2 bg-white rounded-xl shadow-2xl border-2 border-gray-200 overflow-hidden animate-in slide-in-from-top-2 duration-200">
							{/* Header */}
							<div className={`px-5 py-3 flex justify-between items-center ${
								showExplanation.includes('interpreter') ? 'bg-purple-50 border-b-2 border-purple-200' : 'bg-green-50 border-b-2 border-green-200'
							}`}>
								<h3 className={`text-lg font-bold ${
									showExplanation.includes('interpreter') ? 'text-purple-900' : 'text-green-900'
								}`}>
									{showExplanation.includes('interpreter') ? '🔧 Interpretorul de pseudocod' : '💡 Explicație'}
								</h3>
								<button
									onClick={closeExplanationPopup}
									className="text-gray-500 hover:text-gray-700 text-2xl leading-none font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/50 transition-colors"
									title="Închide"
								>
									×
								</button>
							</div>

							{/* Content */}
							<div className="px-5 py-4 max-h-96 overflow-y-auto">
								{loadingExplanation ? (
									<div className="flex items-center justify-center py-8">
										<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
										<span className="ml-3 text-gray-600 font-medium">Generez explicația...</span>
									</div>
								) : (
									<div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
										{explanationText}
									</div>
								)}
							</div>

							{/* Footer */}
							{!loadingExplanation && (
								<div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
									<button
										onClick={closeExplanationPopup}
										className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold transition-colors text-sm"
									>
										Am înțeles
									</button>
								</div>
							)}
						</div>
					</div>
				</>
			)}

			<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<button
					onClick={onNavigateBack}
					className="mb-4 flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
				>
					<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
					</svg>
					Înapoi la detalii
				</button>

				<h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
					Exersează pe test — {subject.anScolar} · {subject.sesiune}
				</h1>

				<div className="mb-8 bg-blue-100 border-l-4 border-blue-600 p-4 rounded-lg">
					<p className="text-blue-800 font-medium">
						📝 Mod de exersare - fără limită de timp. Poți vizualiza explicațiile pentru fiecare exercițiu!
					</p>
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
						<button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
							Trimite răspunsurile
						</button>

						<button type="button" onClick={() => console.log('Preview answers', formState)} className="text-sm text-gray-600 hover:text-gray-800">
							Preview answers
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}

export default PracticeTestPage

