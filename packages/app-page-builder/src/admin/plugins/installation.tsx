import React, { useState, useCallback } from "react";
import gql from "graphql-tag";
import { useApolloClient } from "react-apollo";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { Alert } from "@webiny/ui/Alert";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { Input } from "@webiny/ui/Input";

import { validation } from "@webiny/validation";
import {
    SimpleForm,
    SimpleFormHeader,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";

const t = i18n.ns("api-page-builder/admin/installation");

const IS_INSTALLED = gql`
    query IsPageBuilderInstalled {
        pageBuilder {
            isInstalled {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;

const INSTALL = gql`
    mutation InstallPageBuilder($data: PbInstallInput!) {
        pageBuilder {
            install(data: $data) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;

// eslint-disable-next-line
const installationSteps = {
    1: t`Creating page categories...`,
    2: t`Creating page blocks...`,
    3: t`Creating pages...`,
    4: t`Creating menus...`,
    5: t`Finalizing...`
};

const PBInstaller = ({ onInstalled }) => {
    const client = useApolloClient();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const onSubmit = useCallback(async form => {
        setLoading(true);
        setError(null);
        const { data: res } = await client.mutate({ mutation: INSTALL, variables: { data: form } });
        setLoading(false);
        const { error } = res.pageBuilder.install;
        if (error) {
            setError(error.message);
            return;
        }

        onInstalled();
    }, []);

    return (
        <Form onSubmit={onSubmit} submitOnEnter>
            {({ Bind, submit }) => (
                <SimpleForm>
                    {loading && <CircularProgress label={t`Installing Page Builder...`} />}
                    {error && (
                        <Grid>
                            <Cell span={12}>
                                <Alert title={t`Something went wrong`} type={"danger"}>
                                    {error}
                                </Alert>
                            </Cell>
                        </Grid>
                    )}
                    <SimpleFormHeader title={t`Install Page Builder`} />
                    <SimpleFormContent>
                        <Grid>
                            <Cell span={12}>
                                <Bind name="name" validators={validation.create("required")}>
                                    <Input
                                        label={t`Site Name`}
                                        description={t`Name of your site, eg: "My Site"`}
                                    />
                                </Bind>
                            </Cell>
                        </Grid>
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <ButtonPrimary
                            data-testid="install-pb-button"
                            onClick={submit}
                        >{t`Install Page Builder`}</ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default {
    name: "admin-installation-pb",
    type: "admin-installation",
    title: t`Page Builder app`,
    dependencies: [],
    secure: true,
    async isInstalled({ client }) {
        const { data } = await client.query({ query: IS_INSTALLED });
        return data.pageBuilder.isInstalled.data;
    },
    render({ onInstalled }) {
        return <PBInstaller onInstalled={onInstalled} />;
    }
};
