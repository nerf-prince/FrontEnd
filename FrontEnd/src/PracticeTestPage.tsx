import { useState, useEffect } from 'react'
import Header from './Header'
import type { SubjectData } from './interfaces/SubjectData'
import { generateExplanation, generatePseudocodeInterpreter, type ExerciseContext } from './utils/openaiHelper'
import { TextWithNewlines, CodeWithNewlines } from './utils/TextWithNewlines'

interface PracticeTestPageProps {
	subject: SubjectData
	onNavigateBack: () => void
	onSubmit?: (answers: any) => void
}

function PracticeTestPage({ subject, onNavigateBack, onSubmit }: PracticeTestPageProps) {
	const [showExplanation, setShowExplanation] = useState<string | null>(null)
	const [explanationText, setExplanationText] = useState<string>('')
	const [loadingExplanation, setLoadingExplanation] = useState<boolean>(false)
	const [explanationPosition, setExplanationPosition] = useState<{ top: number; left: number } | null>(null)

	const getStorageKey = () => {
		const subjectId = subject._id?.$oid || `${subject.AnScolar}-${subject.Sesiune}`
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
		localStorage.removeItem(storageKey)

		if (onSubmit) onSubmit(answers)
		else console.log('Submitted answers', answers)
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
			const exKey = parts[0] // Ex1, Ex2, etc.
			const subpoint = parts[1] // a, b, c, d (if exists)
			const isInterpreter = parts[2] === 'interpreter'

			// Get exercise data
			let exerciseData: any
			let exerciseNumber: number

			if (subjectKey === 'Sub1') {
				const sub = subject[subjectKey]
				if (Array.isArray(sub?.Ex)) {
					const idx = parseInt(exKey.replace('Ex', '')) - 1
					exerciseData = sub.Ex[idx]
					exerciseNumber = idx + 1
				} else {
					exerciseData = sub?.[exKey]
					exerciseNumber = parseInt(exKey.replace('Ex', ''))
				}
			} else {
				const sub = subject[subjectKey]
				if (Array.isArray(sub?.Ex)) {
					const idx = parseInt(exKey.replace('Ex', '')) - 1
					exerciseData = sub.Ex[idx]
					exerciseNumber = idx + 1
				} else {
					exerciseData = sub?.[exKey]
					exerciseNumber = parseInt(exKey.replace('Ex', ''))
				}
			}

			// Get user answer
			let userAnswer: string | Record<string, string> | undefined

			if (subjectKey === 'Sub1') {
				userAnswer = formState.Sub1?.[exKey]
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

		if (Array.isArray(sub.Ex)) {
			return (
				<div className="space-y-6">
					{sub.Ex.map((item: any, idx: number) => {
				const exKey = `Ex${idx + 1}`
				const ex = item
				const options = ex?.Options ? String(ex.Options).split('$') : []
				return (
					<div key={exKey} className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
						<div className="flex justify-between items-start mb-2">
							<h3 className="text-lg font-semibold">{`Exercițiul ${idx + 1}`}</h3>
							<button
								type="button"
								onClick={(e) => showExplanationPopup('Sub1', exKey, e)}
								className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
									showExplanation === `Sub1-${exKey}` 
										? 'bg-green-600 text-white' 
										: 'bg-green-500 hover:bg-green-600 text-white'
								}`}
							>
								💡 Explicație
							</button>
						</div>
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
					<div className="flex justify-between items-start mb-2">
						<h3 className="text-lg font-semibold">{`Exercițiul ${exKey.replace('Ex', '')}`}</h3>
						<button
							type="button"
							onClick={(e) => showExplanationPopup('Sub1', exKey, e)}
							className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
								showExplanation === `Sub1-${exKey}` 
									? 'bg-green-600 text-white' 
									: 'bg-green-500 hover:bg-green-600 text-white'
							}`}
						>
							💡 Explicație
						</button>
					</div>
					{ex.Sentence && <TextWithNewlines text={ex.Sentence} className="text-sm text-gray-700 mb-3" />}

							<div className="ml-4 space-y-2">
								{options.map((opt: string, idx: number) => {
									const letter = String.fromCharCode(97 + idx)
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

		if (Array.isArray(sub.Ex)) {
			return (
				<div className="space-y-6">
					{sub.Ex.map((item: any, idx: number) => {
						const exKey = `Ex${idx + 1}`
					const ex = item
					if (!ex) return null
					const hasParts = ex.a || ex.b || ex.c || ex.d
					const isSub2Ex1 = subKey === 'Sub2' && exKey === 'Ex1'
					return (
						<div key={exKey} className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
							<div className="flex justify-between items-start mb-2">
								<h3 className="text-lg font-semibold">{`Exercițiul ${idx + 1}`}</h3>
								<button
									type="button"
									onClick={(e) => showExplanationPopup(subKey, exKey, e)}
									className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
										showExplanation === `${subKey}-${exKey}` 
											? (isSub2Ex1 ? 'bg-purple-600 text-white' : 'bg-green-600 text-white')
											: (isSub2Ex1 ? 'bg-purple-500 hover:bg-purple-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white')
									}`}
								>
								{isSub2Ex1 ? '🔧 Deschide interpretorul de pseudocod' : '💡 Explicație'}
							</button>
						</div>
		{ex.Sentence && <TextWithNewlines text={ex.Sentence} className="text-sm text-gray-700 mb-3" />}
			<CodeWithNewlines code={ex.Code} />
			<div className="ml-4 space-y-3">
					{hasParts ? (
						['a', 'b', 'c', 'd'].map(part =>
							ex[part] ? (
							<div key={part}>
								<div className="flex justify-between items-start mb-1">
									<label className="block text-sm font-medium text-gray-700">{`(${part}) ${ex[part].Sentence || ''}`}</label>
									{isSub2Ex1 && (
										<button
											type="button"
											onClick={(e) => showExplanationPopup(subKey, `${exKey}-${part}${part === 'd' ? '-interpreter' : ''}`, e)}
											className={`px-2 py-1 rounded text-xs font-medium transition-colors ml-2 ${
												showExplanation === `${subKey}-${exKey}-${part}${part === 'd' ? '-interpreter' : ''}`
													? (part === 'd' ? 'bg-purple-600 text-white' : 'bg-green-600 text-white')
													: (part === 'd' ? 'bg-purple-500 hover:bg-purple-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white')
											}`}
										>
											{part === 'd' ? '🔧 Deschide interpretorul de pseudocod' : '💡 Explicație'}
										</button>
									)}
								</div>
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

					const hasParts = ex.a || ex.b || ex.c || ex.d
					const isSub2Ex1 = subKey === 'Sub2' && exKey === 'Ex1'

					return (
						<div key={exKey} className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
							<div className="flex justify-between items-start mb-2">
								<h3 className="text-lg font-semibold">{`Exercițiul ${exKey.replace('Ex', '')}`}</h3>
								<button
									type="button"
									onClick={(e) => showExplanationPopup(subKey, exKey, e)}
									className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
										showExplanation === `${subKey}-${exKey}`
											? (isSub2Ex1 ? 'bg-purple-600 text-white' : 'bg-green-600 text-white')
											: (isSub2Ex1 ? 'bg-purple-500 hover:bg-purple-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white')
									}`}
								>
							{isSub2Ex1 ? '🔧 Deschide interpretorul de pseudocod' : '💡 Explicație'}
						</button>
				</div>
	{ex.Sentence && <TextWithNewlines text={ex.Sentence} className="text-sm text-gray-700 mb-3" />}
	<CodeWithNewlines code={ex.Code} />

	<div className="ml-4 space-y-3">
			{hasParts ? (
				['a', 'b', 'c', 'd'].map(part =>
					ex[part] ? (
					<div key={part}>
						<div className="flex justify-between items-start mb-1">
							<label className="block text-sm font-medium text-gray-700">{`(${part}) ${ex[part].Sentence || ''}`}</label>
							{isSub2Ex1 && (
									<button
										type="button"
										onClick={(e) => showExplanationPopup(subKey, `${exKey}-${part}${part === 'd' ? '-interpreter' : ''}`, e)}
										className={`px-2 py-1 rounded text-xs font-medium transition-colors ml-2 ${
											showExplanation === `${subKey}-${exKey}-${part}${part === 'd' ? '-interpreter' : ''}`
												? (part === 'd' ? 'bg-purple-600 text-white' : 'bg-green-600 text-white')
												: (part === 'd' ? 'bg-purple-500 hover:bg-purple-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white')
										}`}
									>
										{part === 'd' ? '🔧 Deschide interpretorul de pseudocod' : '💡 Explicație'}
									</button>
								)}
							</div>
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
					className="mb-6 flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
				>
					<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
					</svg>
					Înapoi la detalii
				</button>

				<h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
					Exersează pe test — {subject.AnScolar} · {subject.Sesiune}
				</h1>

				<div className="mb-8 bg-blue-100 border-l-4 border-blue-600 p-4 rounded-lg">
					<p className="text-blue-800 font-medium">
						📝 Mod de exersare - fără limită de timp. Poți vizualiza explicațiile pentru fiecare exercițiu!
					</p>
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

