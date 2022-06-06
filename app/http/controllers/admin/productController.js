require('dotenv').config()
const { default: slugify } = require('slugify')
const Product = require('../../../models/product')
const { GraphQLClient, gql } = require('graphql-request')
const path = require('path')
const API_URL = process.env.API_URL
var cloudinary = require('cloudinary').v2

function productController() {
	return {
		async index(req, res) {
			const variables = {
				data: {
					limit: 30,
				},
				filter: {
					status: 'ativo',
				},
			}

			const query = gql`
				query GetAllProducts($data: PaginationInput!, $filter: ProductFilter) {
					getAllProducts(data: $data, filter: $filter) {
						products {
							_id
							name
							description
							image
							categories
							status
							saleUnits {
								_id
								saleUnit
								description
								price
								active
								isDefault
							}
						}
					}
				}
			`

			const graphQLClient = new GraphQLClient(API_URL)

			const data = await graphQLClient.request(query, variables)

			//const products = await Product.find({ active: true })

			const { products } = data.getAllProducts

			const categories = new Set()

			products.forEach((product) => categories.add(...product.categories))

			return res.render('admin/products', {
				products: products,
				categories: categories,
			})
		},

		async handleProduct(req, file) {
			const productName = req.body.name
			const fileExtension =
				req.file !== undefined ? path.extname(req.file.filename) : ''

			const image =
				req.file !== undefined
					? slugify(productName, {
							lower: true, // convert to lower case, defaults to `false`
					  }) + fileExtension
					: req.body.imageName

			let imageUrl = ''

			await cloudinary.uploader.upload(
				`public/img/${image}`,
				function (error, result) {
					if (error) {
						console.warn(error)
					}
					imageUrl = result.url
				},
			)

			let productData = {
				id: req.body.id,
				name: req.body.name,
				image: imageUrl,
				saleUnits: req.body.saleUnit.map((unit, i) => ({
					saleUnit: unit,
					price: parseFloat(
						req.body.price[i].replace(/,/, '.').replace(/[^0-9.]+/, ''),
					),
					description: req.body.description[i],
					active: req.body.active[i] == 1 ? true : false,
				})),
				category: req.body.category,
				active: req.body.productActive == 1 ? true : false,
			}
			//checa se tem id no body da requisição, se tiver atualiza o cliente
			//se não, cria um novo.
			if (!req.body.id) {
				const product = new Product(productData)

				await product
					.save()
					.then((product) => {
						return product
					})
					.catch((err) => {
						console.log(err)
						req.flash('error', 'Algo deu errado, tente novamente')
						//  return res.redirect('/admin/clients');
					})
			} else {
				const productId = productData.id

				await Product.findByIdAndUpdate(
					productId,
					productData,
					function (err, product) {
						if (err) {
							console.log(err)
							// return res.redirect('/admin/clients');
						} else {
							return product
						}
					},
				)
			}
		},

		async searchProduct(req, res) {
			const { filter } = req.params

			const variables = {
				data: {
					limit: 30,
				},
				filter: JSON.parse(filter) || {},
			}

			const query = gql`
				query GetAllProducts($data: PaginationInput!, $filter: ProductFilter) {
					getAllProducts(data: $data, filter: $filter) {
						products {
							_id
							name
							description
							image
							categories
							status
							saleUnits {
								_id
								saleUnit
								description
								price
								active
								isDefault
							}
						}
					}
				}
			`

			const graphQLClient = new GraphQLClient(API_URL)

			const data = await graphQLClient.request(query, variables)

			//const products = await Product.find({ active: true })

			const { products } = data.getAllProducts

			const categories = new Set()

			products.forEach((product) => categories.add(...product.categories))

			res.send(products)
		},

		async searchProductById(req, res) {
			const idToSearch = req.params.productid

			Product.findById(idToSearch)

				.then((Product) => {
					res.send(Product)
				})
				.catch((err) => {
					res
						.status(500)
						.send({ message: err.message || 'Produto não encontrado.' })
				})
		},

		async searchProductByName(req, res) {
			const productToSearch = req.params.productname

			if (productToSearch == 'all') {
				await Product.find()
					.then((products) => {
						res.send(products)
					})
					.catch((err) => {
						res
							.status(500)
							.send({ message: err.message || 'Produto não encontrado.' })
					})
				return
			}

			await Product.find({ name: { $regex: new RegExp(productToSearch, 'i') } })
				.then((product) => {
					res.send(product)
				})
				.catch((err) => {
					res
						.status(500)
						.send({ message: err.message || 'Produto não encontrado.' })
				})
		},
	}
}

module.exports = productController
