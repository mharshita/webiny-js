import { HandlerApolloServerOptions } from "@webiny/handler-graphql/types";

// We can rely on the default "handler" and "handler-graphql-create-schema" plugins...
import { createHandlerApolloServer, createSchema } from "@webiny/handler-graphql/plugins";

// ...but a custom "handler-graphql-create-handler" plugin is needed.
import apolloHandler from "./apolloHandler";

// This is a factory function which returns a specific set of plugins depending on
// the provided environment and schema type (read, manage, preview).
import headlessPlugins from "./plugins";

export default (options: HandlerApolloServerOptions) => [
    {
        type: "handler",
        name: "handler-setup-headless-plugins",
        async handle(context, next) {
            // We register plugins according to the received path params (schema type and environment).
            const { key = "" } = context.http.path.parameters || {};
            const [type = null, environment = null] = key.split("/");
            context.plugins.register(
                await headlessPlugins({
                    type,
                    environment
                })
            );
            return next();
        }
    },
    createHandlerApolloServer(options),
    createSchema,
    apolloHandler
];
