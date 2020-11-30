const DATA_FIELD = /* GraphQL*/ `
    {
        id
        name
        slug
        description
        createdOn
        changedOn
        createdFrom {
            id
            name
            slug
            description
            createdOn
            changedOn
        }
    }
`;
const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const CREATE_ENVIRONMENT_MUTATION = /* GraphQL */ `
    mutation CreateEnvironmentMutation($data: CmsEnvironmentInput!) {
        cms {
            createEnvironment(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
export const GET_ENVIRONMENT_QUERY = /* GraphQL */ `
    query GetEnvironmentQuery($id: ID!) {
        cms {
            getEnvironment(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
export const UPDATE_ENVIRONMENT_MUTATION = /* GraphQL */ `
    mutation UpdateEnvironmentMutation($id: ID!, $data: CmsEnvironmentInput!) {
        cms {
            updateEnvironment(id: $id, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
export const DELETE_ENVIRONMENT_MUTATION = /* GraphQL */ `
    mutation DeleteEnvironmentMutation($id: ID!) {
        cms {
            updateEnvironment(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
export const LIST_ENVIRONMENT_QUERY = /* GraphQL */ `
    query ListEnvironmentQuery {
        cms {
            listEnvironment {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;