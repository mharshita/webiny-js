import { hasPermission, NotAuthorizedResponse } from "@webiny/api-security";
import { compose } from "@webiny/handler-graphql";
import { hasI18NContentPermission } from "@webiny/api-i18n-content";
import { Context as HandlerContext } from "@webiny/handler/types";
import { I18NContext } from "@webiny/api-i18n/types";
import { SecurityContext } from "@webiny/api-security/types";
import {
    CmsContextType,
    CmsEnvironmentCreateInputType,
    CmsEnvironmentType,
    CmsEnvironmentUpdateInputType
} from "@webiny/api-headless-cms/types";
import { ErrorResponse, NotFoundResponse, Response } from "@webiny/handler-graphql/responses";
import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { TenancyContext, Tenant } from "@webiny/api-security-tenancy/types";

const CMS_ENVIRONMENT_PERMISSION_NAME = "cms.manage.setting";

type HasRwdCallableArgsType = {
    permission?: {
        rwd?: string;
    };
    rwd: string;
};
type ResolverContext = HandlerContext<I18NContext, SecurityContext, CmsContextType, TenancyContext>;

type CreateEnvironmentArgsType = {
    data: CmsEnvironmentCreateInputType;
};
type ReadEnvironmentArgsType = {
    id: string;
};
type UpdateEnvironmentArgsType = ReadEnvironmentArgsType & {
    data: CmsEnvironmentUpdateInputType;
};
type DeleteEnvironmentArgsType = {
    id: string;
};

const hasRwd = ({ permission, rwd }: HasRwdCallableArgsType) => {
    if (!permission || !permission.rwd) {
        return false;
    } else if (typeof permission.rwd !== "string") {
        return true;
    }
    const requiredAccess: string[] = rwd.split("");

    return requiredAccess.every(required => {
        return permission.rwd.includes(required);
    });
};

const userCanManage = (tenant: Tenant, { createdBy }: CmsEnvironmentType): boolean => {
    if (!createdBy) {
        return false;
    }
    return createdBy.id === tenant.id;
};

const hasPermissionRwd = (rwd: string) => {
    return (resolver: GraphQLFieldResolver) => {
        return async (parent, args, context, info) => {
            const permission = await context.security.getPermission(
                CMS_ENVIRONMENT_PERMISSION_NAME
            );
            if (!permission || !hasRwd({ permission, rwd })) {
                return new NotAuthorizedResponse();
            }
            return resolver(parent, args, context, info);
        };
    };
};

const getEnvironmentPermission = async (context: ResolverContext) => {
    return await context.security.getPermission(CMS_ENVIRONMENT_PERMISSION_NAME);
};

export default {
    typeDefs: /* GraphQL */ `
        type CmsEnvironment {
            id: ID
            createdOn: DateTime
            name: String
            description: String
            createdFrom: CmsEnvironment
            environmentAliases: [CmsEnvironmentAlias]
            contentModels: [CmsContentModel]
            isProduction: Boolean
            slug: String
        }

        type CmsContentModel {
            id: ID
            modelId: String
            name: String
        }

        input CmsEnvironmentInput {
            name: String
            description: String
            slug: String
            createdFrom: ID
        }

        # Response types
        type CmsEnvironmentResponse {
            data: CmsEnvironment
            error: CmsError
        }

        type CmsEnvironmentListResponse {
            data: [CmsEnvironment]
            meta: CmsListMeta
            error: CmsError
        }

        extend type CmsQuery {
            getEnvironment(id: ID, where: JSON, sort: String): CmsEnvironmentResponse

            listEnvironments(
                where: JSON
                sort: JSON
                search: CmsSearchInput
                limit: Int
                after: String
                before: String
            ): CmsEnvironmentListResponse
        }

        extend type CmsMutation {
            createEnvironment(data: CmsEnvironmentInput!): CmsEnvironmentResponse

            updateEnvironment(id: ID!, data: CmsEnvironmentInput!): CmsEnvironmentResponse

            deleteEnvironment(id: ID!): CmsDeleteResponse
        }
    `,
    resolvers: {
        CmsQuery: {
            getEnvironment: compose(
                hasPermission(CMS_ENVIRONMENT_PERMISSION_NAME),
                hasPermissionRwd("r"),
                hasI18NContentPermission()
            )(async (_, args: ReadEnvironmentArgsType, context: ResolverContext) => {
                const permission = await getEnvironmentPermission(context);

                const { id } = args;

                const environmentContext = context.cms.environment;

                const model = await environmentContext.get(id);
                if (!model) {
                    return new NotFoundResponse(`CMS Environment "${id}" not found.`);
                }

                if (
                    permission.own === true &&
                    !userCanManage(context.security.getTenant(), model)
                ) {
                    return new NotAuthorizedResponse();
                }

                return new Response(model);
            }),
            listEnvironments: compose(
                hasPermission(CMS_ENVIRONMENT_PERMISSION_NAME),
                hasPermissionRwd("r"),
                hasI18NContentPermission()
            )(async (_, __, context: ResolverContext) => {
                const permission = await getEnvironmentPermission(context);

                const environmentContext = context.cms.environment;

                const environments = await environmentContext.list();
                if (permission.own === true) {
                    const tenant = context.security.getTenant();
                    return new Response(environments.filter(model => userCanManage(tenant, model)));
                }
                return new Response(environments);
            })
        },
        CmsMutation: {
            createEnvironmentNew: compose(
                hasPermission(CMS_ENVIRONMENT_PERMISSION_NAME),
                hasPermissionRwd("w"),
                hasI18NContentPermission()
            )(async (_, args: CreateEnvironmentArgsType, context: ResolverContext) => {
                const tenant = context.security.getTenant();
                const environmentContext = context.cms.environment;

                const { data } = args;
                const createdBy = {
                    id: tenant.id,
                    name: tenant.name
                };
                try {
                    return new Response(await environmentContext.create(data, createdBy));
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }),
            updateEnvironmentNew: compose(
                hasPermission(CMS_ENVIRONMENT_PERMISSION_NAME),
                hasPermissionRwd("rw"),
                hasI18NContentPermission()
            )(async (_, args: UpdateEnvironmentArgsType, context: ResolverContext) => {
                const permission = await getEnvironmentPermission(context);

                const { id, data } = args;

                const environmentContext = context.cms.environment;

                const model = await environmentContext.get(id);
                if (!model) {
                    return new NotFoundResponse(`CMS Environment "${id}" not found.`);
                }

                if (
                    permission.own === true &&
                    !userCanManage(context.security.getTenant(), model)
                ) {
                    return new NotAuthorizedResponse();
                }

                try {
                    const changedModel = await environmentContext.update(id, data);
                    return new Response({ ...model, ...changedModel });
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }),
            deleteEnvironmentNew: compose(
                hasPermission(CMS_ENVIRONMENT_PERMISSION_NAME),
                hasPermissionRwd("rd"),
                hasI18NContentPermission()
            )(async (_, args: DeleteEnvironmentArgsType, context: ResolverContext) => {
                const { id } = args;
                const permission = await getEnvironmentPermission(context);

                const environmentContext = context.cms.environment;

                const model = await environmentContext.get(id);
                if (!model) {
                    return new NotFoundResponse(`CMS Environment "${id}" not found.`);
                }

                if (
                    permission.own === true &&
                    !userCanManage(context.security.getTenant(), model)
                ) {
                    return new NotAuthorizedResponse();
                }

                await environmentContext.delete(id);

                return new Response(model);
            })
        }
    }
};
