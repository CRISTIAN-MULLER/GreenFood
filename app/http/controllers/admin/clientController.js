require('dotenv').config()
const User = require('../../../models/user')
const { GraphQLClient, gql } = require('graphql-request')
const API_URL = process.env.API_URL

function userController() {
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

			User.find()
				.populate('customerId', '-password')
				.exec((err, clients) => {
					if (req.xhr) {
						return res.json(clients)
					} else {
						return res.render('admin/clients')
					}
				})
		},

		async handleUser(req, res) {
			const userData = {
				id: req.body.id ? req.body.id : '',
				username: req.body.username,
				phone: req.body.phone,
				address: {
					zipcode: req.body.zipcode,
					street: req.body.street,
					houseNumber: req.body.houseNumber,
					district: req.body.district,
					city: req.body.city,
					state: req.body.state,
					reference: req.body.reference,
				},
			}

			//checa se tem id no body da requisição, se tiver atualiza o cliente
			//se não, cria um novo.
			if (!req.body.id) {
				const user = new User(userData)

				await user
					.save()
					.then((user) => {
						return user
					})
					.catch((err) => {
						console.log(err)
						req.flash('error', 'Algo deu errado, tente novamente')
						//  return res.redirect('/admin/clients');
					})
			} else {
				const clientId = userData.id

				await User.findByIdAndUpdate(clientId, userData, function (err, user) {
					if (err) {
						console.log(err)
						// return res.redirect('/admin/clients');
					} else {
						return user
					}
				})
			}
		},
	}
}

module.exports = userController
