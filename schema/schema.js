const graphql = require('graphql');
//const _ = require('lodash');
const axios = require('axios');

const {
    GraphQLObjectType,
    GraphQLInt,
    GraphQLString,
    GraphQLSchema,
    GraphQLList,
    GraphQLNonNull

} = graphql;

// const users = [
//  {id: '23', firstName: 'Bill', age: 20},   
//  {id: '47', firstName: 'Samantha', age: 21}   
// ];

const CompanyType = new GraphQLObjectType({
    name: 'Company',
    fields: () => ({
        id: { type: GraphQLString },
        name: { type: GraphQLString },
        description: { type: GraphQLString },
        users: {
            type: new GraphQLList(UserType),
            resolve(parentValue, args) {
                return axios.get(`http://localhost:3000/companies/${parentValue.id}/users`)
                    .then(res => res.data);
            }
        }
    })
});

const UserType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
        id: { type: GraphQLString },
        firstName: { type: GraphQLString },
        age: { type: GraphQLInt },
        company: {
            type: CompanyType,
            // the purpose of the resolve() is to resolve the differencies between the model property name 
            // and the type property name.
            // in this case we have UserType.fields.company for Type and db.json->users[0].companyId
            // resolve function will populate company property. Resolve() plays a role of JPA mappedBy
            // resolve function connects different nodes in the graph
            resolve(parentValue, args) {
                console.log(parentValue, args);
                return axios.get(`http://localhost:3000/companies/${parentValue.companyId}`)
                // need data from resp
                    .then(resp => resp.data);
            }
        }
    })
});



const RootQuery = new GraphQLObjectType({
    name: "RootQueryType",
    fields: {
        user: {
            type: UserType,
            args: { id: { type: GraphQLString } },
            resolve(parentValue, args) {
                //return _.find(users, {id: args.id}) // synchronous with hardcoded value
                return axios.get(`http://localhost:3000/users/${args.id}`)
                    .then(response => response.data);

            },

        },
        company: {
            type: CompanyType,
            args: {id: {type: GraphQLString}},
            resolve(parentValue, args) {
                return axios.get(`http://localhost:3000/companies/${args.id}`)
                    .then(resp => resp.data);
            }
        }
    }
});

const mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        addUser: {
            type: UserType, 
            args: {
                firstName: {type: new GraphQLNonNull(GraphQLString)},
                age: {type: new GraphQLNonNull(GraphQLInt)},
                companyId: {type: GraphQLString}
            }, 
            resolve(parentValue, {firstName, age}) {
                return axios.post("http://localhost:3000/users", {firstName, age})
                    .then(res => res.data);
            }
        },
        deleteUser: {
            type: UserType,
            args: {
                id: {type: new GraphQLNonNull(GraphQLString)},
            },
            resolve(parentValue, {id}) {
                return axios.delete(`http://localhost:3000/users/${id}`)
                .then(res => res.data)
            }
        },
        editUser: {
            type: UserType, 
            args: {
                id: {type: new GraphQLNonNull(GraphQLString)},
                firstName: {type: GraphQLString},
                age: {type: GraphQLString},
                companyId: {type: GraphQLString}
            },
            resolve(parentValue, args) {
                    return axios.patch(`http://localhost:3000/users/${args.id}`, args)
                        .then(res => res.data);
                }
            }
        }
    }
);

module.exports = new GraphQLSchema({
     query: RootQuery,
     mutation 
})