require('dotenv').config()
const Product = require('../../models/product')
const { GraphQLClient, gql } = require('graphql-request')
const API_URL = process.env.API_URL

function homeController() {
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

			return res.render('home', { products: products, categories: categories })
		},

		async mobielIndex(req, res) {
			const products = await Product.find({ active: true })
				.then((Products) => {
					res.send(Products)
				})
				.catch((err) => {
					res
						.status(500)
						.send({ message: err.message || 'Deu ruim so pegar os livros' })
				})

			// const categories = [
			//   ...new Set(products.map((product) => product.category)),
			// ];
			// res.send(products, categories);
		},
	}
}

module.exports = homeController
