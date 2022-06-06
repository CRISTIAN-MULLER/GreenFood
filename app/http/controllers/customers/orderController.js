const Order = require('../../../models/order')
const User = require('../../../models/user')
const moment = require('moment')
const { GraphQLClient, gql } = require('graphql-request')
const API_URL = process.env.API_URL

function orderController(e) {
	return {
		async store(req, res) {
			const variables = {
				data: {
					customerId: req.user._id,
					deliveryAddress: {
						name: req.body.username,
						zipcode: req.body.zipcode,
						street: req.body.street,
						houseNumber: req.body.houseNumber,
						district: req.body.district,
						city: req.body.city,
						state: req.body.state,
						reference: req.body.reference,
						location: {
							type: 'point',
							coordinates: {
								latitude: 0,
								longitude: 0,
								latitudeDelta: 0,
								longitudeDelta: 0,
							},
						},
					},
					items: req.session.cart.items,
					phone: req.body.phone,
					payment: {
						paymentMethod: {
							delivery: {
								cash: {
									change: '50',
								},
							},
						},
						paymentStatus: 'TO_PAY',
					},
					origin: 'WEB',
					status: 'ORDER_PLACED',
					step: 1,
					observation: req.body.observation,
				},
			}

			const mutation = gql`
				mutation CreateOrder($data: OrderInput!) {
					createOrder(data: $data) {
						_id
						orderNumber
						customerId
					}
				}
			`

			const graphQLClient = new GraphQLClient(API_URL)

			const data = await graphQLClient.request(mutation, variables)

			req.flash('success', 'Pedido feito com sucesso')
			delete req.session.cart
			return res.redirect('/customer/orders')

			//let userAddress = req.user.address

			// if (JSON.stringify(userAddress) === '{}') {
			// 	const userData = {
			// 		phone: req.body.phone,
			// 		address: {
			// 			zipcode: req.body.zipcode,
			// 			street: req.body.street,
			// 			houseNumber: req.body.houseNumber,
			// 			district: req.body.district,
			// 			city: req.body.city,
			// 			state: req.body.state,
			// 			reference: req.body.reference,
			// 		},
			// 	}

			// 	await User.findByIdAndUpdate(
			// 		req.user._id,
			// 		userData,
			// 		function (err, user) {
			// 			if (err) {
			// 				console.log(err)
			// 				// return res.redirect('/admin/clients');
			// 			} else {
			// 				return user
			// 			}
			// 		},
			// 	)
			// }

			// const {
			// 	phone,
			// 	zipcode,
			// 	street,
			// 	houseNumber,
			// 	district,
			// 	city,
			// 	state,
			// 	reference,
			// 	observation,
			// 	paymentMethod,
			// 	entryPoint = 'Site',
			// } = req.body

			// const order = new Order({
			// 	customerId: req.user._id,
			// 	items: req.session.cart.items,
			// 	phone,
			// 	address: {
			// 		zipcode,
			// 		street,
			// 		houseNumber,
			// 		district,
			// 		city,
			// 		state,
			// 		reference,
			// 	},
			// 	observation,
			// 	paymentMethod,
			// 	entryPoint,
			// })

			// order
			// 	.save()
			// 	.then((result) => {
			// 		req.flash('success', 'Pedido feito com sucesso')
			// 		delete req.session.cart
			// 		return res.redirect('/customer/orders')
			// 	})
			// 	.catch((err) => {
			// 		req.flash('error', 'Algo deu errado, tente novamente.')
			// 		console.log(err)
			// 		return res.redirect('/cart')
			// 	})
		},
		async index(req, res) {
			const orders = await Order.find({ customerId: req.user._id }, null, {
				sort: { createdAt: -1 },
			})

			res.header('Cache-Control', 'no-store')
			res.render('customers/orders', { orders: orders, moment: moment })
		},
		async show(req, res) {
			const order = await Order.findById(req.params.id)
			// Authorize user
			// @ts-ignore
			if (req.user._id.toString() === order.customerId.toString()) {
				return res.render('customers/singleOrder', { order })
			}
			return res.redirect('/')
		},
	}
}
module.exports = orderController
