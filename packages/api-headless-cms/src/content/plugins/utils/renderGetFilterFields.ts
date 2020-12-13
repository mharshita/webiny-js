import { CmsFieldTypePlugins, CmsContentModelType } from "@webiny/api-headless-cms/types";

interface RenderGetFilterFields {
    (params: { model: CmsContentModelType; fieldTypePlugins: CmsFieldTypePlugins }): string;
}

export const renderGetFilterFields: RenderGetFilterFields = ({ model, fieldTypePlugins }) => {
    const uniqueIndexFields = (model as any).getUniqueIndexFields();

    return uniqueIndexFields
        .map(fieldId => {
            if (fieldId === "id") {
                return "id: ID";
            }

            const field = model.fields.find(item => item.fieldId === fieldId);
            const { createGetFilters } = fieldTypePlugins[field.type]["read"];
            if (typeof createGetFilters === "function") {
                return createGetFilters({ model, field });
            }
        })
        .filter(Boolean)
        .join("\n");
};
