import { Editor } from '@tinymce/tinymce-react'
import axios from 'axios'
import Cookies from 'js-cookie'
import { useRef, useState } from 'react'
import './App.css'
import { sendImage } from './utils/sendImage'

export default function App() {
	const editorRef = useRef(null)
	const fileInputRef = useRef(null)
	const [textValue, setTextValue] = useState('')
	const [localContent, setLocalContent] = useState('')

	const handleMessage = event => {
		console.log('wwwww', event.origin)
		if (event.origin === 'https://simfpolyteh.ru') {
			const { key, value } = event.data
			console.log('CHECK MET', value)
			if (key === 'contentPolytech') {
				const processedHtml = updateImageSource(value)
				const withLocalLinks = insertLocalhostToLinks(processedHtml)
				const updatedHtml = updateLinks(withLocalLinks)

				setLocalContent(updatedHtml)
				setTextValue(updatedHtml)
				console.log('updatedHtml', updatedHtml)
				if (editorRef.current) {
					console.log('worked')
					editorRef.current.setContent(updatedHtml)
				}
			}
		}
	}
	const addPageInServer = async () => {
		try {
			let newUrl = ''
			const urlImg = Cookies.get('imgUrl')
			const urlPage = Cookies.get('urlPage')
			if (urlImg && urlPage) {
				sendImage(urlImg, urlPage)
			}

			const token = await Cookies.get('token')

			const sometext = editorRef.current.getContent()
			function removeLocalhostURL(text) {
				// Используем регулярное выражение для замены ссылки на пустую строку с использованием переменной link
				const link = import.meta.env.VITE_API_URL
				return text.replace(new RegExp(link, 'g'), '')
			}
			function removeLocalhostFromHref(htmlString) {
				const link = import.meta.env.VITE_API_URL
				return htmlString.replace(new RegExp(link, 'g'), '')
			}

			const resultText = removeLocalhostURL(sometext)

			const cleanedHtml = removeLocalhostFromHref(resultText)
			const typePage = Cookies.get('typePage')
			const URLPage = Cookies.get('urlPage')
			const titlePage = Cookies.get('titlePage')
			console.log('title', titlePage)
			const someDate = await axios.put(
				`${import.meta.env.VITE_API_URL}/page/topublic`,
				{ URLPage, typePage, textValue: cleanedHtml, titlePage },
				{
					headers: {
						'Access-Control-Allow-Origin': '*',
						Authorization: `Bearer ${token}`,
					},
				}
			)

			if (someDate.status == 208) {
				console.log(someDate.data.message)
				setLocalContent('')
				Cookies.remove('typePage')
				Cookies.remove('urlPage')
				Cookies.remove('titlePage')
				Cookies.remove('imgUrl')
				setTextValue('')
			}
			if (someDate.status == 200) {
				setLocalContent('')
				Cookies.remove('typePage')
				Cookies.remove('urlPage')
				Cookies.remove('titlePage')
				Cookies.remove('imgUrl')
				setTextValue('')
				//dispatch(textValueFunc(''))
			}
		} catch (error) {
			console.log(error)
			alert(
				`${error.response.data.message}. Текущий статус:${error.response.status}`
			) // Handle any errors
		}
	}

	const updateImageSource = text => {
		const link = import.meta.env.VITE_API_URL || 'http://localhost:4444'
		return text.replace(
			/src\s*=\s*(['"]?)\s*\/uploads/g,
			`src=$1${link}/uploads`
		)
	}

	const insertLocalhostToLinks = html => {
		const serverUrl = import.meta.env.VITE_API_CLOUD || 'http://localhost:4455'
		if (!serverUrl) {
			console.error('NEXT_PUBLIC_SERVER_URL is not defined')
			return html
		}
		const regex = /href\s*=\s*(['"]?)\s*\/uploads/g
		const replacement = `href=$1${serverUrl}/uploads`
		return html.replace(regex, replacement)
	}

	const updateLinks = htmlContent => {
		const frontendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
		if (!frontendUrl) {
			console.error('NEXT_PUBLIC_FRONTEND_URL is not defined')
			return htmlContent
		}
		const regex = /href\s*=\s*(['"]?)\s*\/our-colleage\//g
		const replacement = `href=$1${frontendUrl}/our-colleage/`
		return htmlContent.replace(regex, replacement)
	}

	// Добавляем обработчик через 5 секунд
	window.addEventListener('message', handleMessage)

	// Очистка обработчика при размонтировании компонента (если нужно)
	// Например, если компонент будет размонтирован, можно добавить:
	// return () => {
	//   window.removeEventListener('message', handleMessage);
	// };

	return (
		<>
			{textValue.trim().length > 0 && (
				<Editor
					tinymceScriptSrc={'/adminka/public/tinymce/tinymce.min.js'}
					onInit={(_evt, editor) => (editorRef.current = editor)}
					initialValue={textValue}
					init={{
						license_key: 'gpl',
						base_url: '/adminka/tinymce',
						language: 'ru',
						language_url: '/adminka/tinymce/langs/ru.js',
						height: 500,
						branding: false,
						 valid_elements: '*[*]', // Разрешает все элементы
  extended_valid_elements: 'script[src|type|async|defer]', // Разрешает <script> с атрибутами
  valid_children: '+body[script]', // Позволяет размещать <script> внутри <body>
  content_css: false, 
  remove_script_host: false,
						plugins: [
							'advlist',
							'autolink',
							'lists',
							'link',
							'image',
							'charmap',
							'preview',
							'anchor',
							'searchreplace',
							'visualblocks',
							'code',
							'fullscreen',
							'insertdatetime',
							'media',
							'table',
							'code',
							'help',
							'wordcount',
						],
						toolbar:
							'undo redo | blocks | ' +
							'bold italic forecolor | alignleft aligncenter alignright | ' +
							'bullist numlist outdent indent | image link uploadfile | removeformat | help',
						content_style: `
              body { font-family:Helvetica,Arial,sans-serif; font-size:14px }
              .image-center { display: flex; justify-content: center; }
            `,
						setup: editor => {
							editor.ui.registry.addButton('uploadfile', {
								text: 'Загрузить файл',
								icon: 'upload',
								onAction: () => {
									fileInputRef.current.click()
								},
							})
						},
						images_upload_handler: async blobInfo => {
							const file = blobInfo.blob()
							const formData = new FormData()
							formData.append('image', file)

							try {
								const token = Cookies.get('token')
								const response = await axios.post(
									`${import.meta.env.VITE_API_URL}/upload`,
									formData,
									{
										headers: { Authorization: `Bearer ${token}` },
									}
								)

								const imageUrl = `${import.meta.env.VITE_API_URL}${
									response.data.imagelink
								}`
								return imageUrl
							} catch (err) {
								console.error(err)
								throw new Error('Не удалось загрузить изображение')
							}
						},
					}}
				/>
			)}

			<button onClick={() => console.log(editorRef.current.getContent())}>
				Log editor content
			</button>
			<button onClick={() => addPageInServer()}>ОПУБЛИКОВАТЬ</button>
			<input
				ref={fileInputRef}
				type='file'
				accept='.pdf, .docx, .xlsx, .csv, .doc, .txt'
				style={{ display: 'none' }}
				onChange={event => {
					const file = event.target.files[0]
					if (!file) return

					const formData = new FormData()
					formData.append('file', file)

					axios
						.post(`${import.meta.env.VITE_API_URL}/uploadpdf`, formData, {
							headers: { Authorization: `Bearer ${Cookies.get('token')}` },
						})
						.then(response => {
							const fileUrl = `${import.meta.env.VITE_API_URL}${
								response.data.pdflink
							}`
							alert(`Файл успешно загружен! Ссылка: ${fileUrl}`)
							if (editorRef.current) {
								editorRef.current.insertContent(
									`<p><a href="${fileUrl}" target="_blank">${file.name}</a></p>`
								)
							}
						})
						.catch(err => {
							console.error(err)
							alert('Ошибка при загрузке файла')
						})
				}}
			/>
		</>
	)
}
