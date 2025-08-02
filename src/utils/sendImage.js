import axios from 'axios'
import Cookies from 'js-cookie'
export const sendImage = async (imageUrl, pageUrl) => {
	try {
		console.log('it a send image', pageUrl, imageUrl)
		const token = await Cookies.get('token')
		function extractImagePath(text) {
			const regex = /\/uploads\/[\w.-]+\.(jpg|jpeg|png|gif)/
			const result = text.match(regex)
			if (result && result.length > 0) {
				return result[0]
			} else {
				return ''
			}
		}
		await axios.put(
			`${import.meta.env.VITE_API_URL}/page/imagepage`,
			{
				pageUrl,
				pageImageUrl: extractImagePath(imageUrl),
				isUpdatedImage: true,
			},
			{ headers: { Authorization: `Bearer ${token}` } }
		)
	} catch (error) {
		console.log(error)
		alert('произошла ошибка сервера')
	}
}
