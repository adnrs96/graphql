/*
 * This file contains some customisations over the default PostGraphile.
 */
module.exports = function AsyncyPlugin(builder) {
  builder.hook("inflection", (inflection, build) => {
    return {
      ...inflection,

      // Don't turn 'AppDns' into 'AppDn'
      _singularizedTableName(table) {
        const tableName = this._tableName(table);
        if (tableName.match(/dns$/i)) {
          return tableName;
        } else {
          return inflection._singularizedTableName(table);
        }
      },

      // Pluralize AppDns correctly
      pluralize(string) {
        if (string.match(/dns$/i)) {
          return string + 'es';
        } else {
          return inflection.pluralize(string);
        }
      },

      // This removes the 'ByFooIdAndBarId' from the end of relations.
      //
      // If this causes a conflict, use smart comments:
      //
      //   https://www.graphile.org/postgraphile/smart-comments/#renaming
      //
      // to rename the relation.
      singleRelationByKeys(detailedKeys, table, _foreignTable, constraint) {
        if (constraint.tags.fieldName) {
          return constraint.tags.fieldName;
        }
        return this.camelCase(
          `${this._singularizedTableName(table)}`
        );
      },
      manyRelationByKeys(detailedKeys, table, _foreignTable, constraint) {
        if (constraint.tags.foreignFieldName) {
          return constraint.tags.foreignFieldName;
        }
        return this.camelCase(
          `${this.pluralize(
            this._singularizedTableName(table)
          )}`
        );
      },
      manyRelationByKeysSimple(detailedKeys, table, _foreignTable, constraint) {
        if (constraint.tags.foreignFieldName) {
          return constraint.tags.foreignFieldName;
        }
        return this.camelCase(
          `${this.pluralize(
            this._singularizedTableName(table)
          )}`
        );
      },

    };
  });
}
