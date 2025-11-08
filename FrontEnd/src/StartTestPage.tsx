
import { useState } from 'react'
import Header from './Header'
import type { SubjectData } from './interfaces/SubjectData'

interface StartTestPageProps {
	subject: SubjectData
	onNavigateBack: () => void
	onSubmit?: (answers: any) => void
}

// The page renders the subject and a form to collect the user's answers.
// For Sub1 we render radio options (a/b/c/d) extracted from `Options`.
// For Sub2 and Sub3 we render text inputs / textareas for free text answers.

function StartTestPage({ subject, onNavigateBack, onSubmit }: StartTestPageProps) {
	const [formState, setFormState] = useState<Record<string, any>>({})

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

		// Optionally map into the project's `UserAnswer` shape if desired.
		if (onSubmit) onSubmit(answers)
		else console.log('Submitted answers', answers)
	}

	const renderSub1 = (sub: any) => {
		if (!sub) return null
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
							{ex.Sentence && <p className="text-sm text-gray-700 mb-3">{ex.Sentence}</p>}

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
											<span className="font-medium">{letter}</span>
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
							{ex.Sentence && <p className="text-sm text-gray-700 mb-3">{ex.Sentence}</p>}
							{ex.Code && (
								<pre className="bg-gray-100 p-3 rounded mb-3 text-sm overflow-x-auto">{ex.Code}</pre>
							)}

							<div className="ml-4 space-y-3">
								{hasParts ? (
									['a', 'b', 'c', 'd'].map(part =>
										ex[part] ? (
											<div key={part}>
												<label className="block text-sm font-medium text-gray-700 mb-1">{`(${part}) ${ex[part].Sentence || ''}`}</label>
												<input
													type="text"
													value={formState[subKey]?.[exKey]?.[part] || ''}
													onChange={(e) => handleTextChange(subKey, exKey, part, e.target.value)}
													className="w-full px-3 py-2 border rounded-lg"
												/>
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
					Completează testul — {subject.AnScolar} · {subject.Sesiune}
				</h1>

				<form onSubmit={submit} className="space-y-8">
					<section>
						<h2 className="text-2xl font-bold mb-4">Subiectul 1 (alegere multiple)</h2>
						{renderSub1(subject.Sub1)}
					</section>

					<section>
						<h2 className="text-2xl font-bold mb-4">Subiectul 2 (completare)</h2>
						{renderSub2or3('Sub2', subject.Sub2)}
					</section>

					<section>
						<h2 className="text-2xl font-bold mb-4">Subiectul 3 (completare)</h2>
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
