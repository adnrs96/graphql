import { Plugin, SchemaBuilder, Inflection } from 'postgraphile'

/*
 * This file contains some customisations over the default PostGraphile.
 */

let StoryscriptPlugin: Plugin

// eslint-disable-next-line prefer-const
StoryscriptPlugin = function(builder: SchemaBuilder) {
  builder.hook('inflection', (inflection: Inflection) => ({
    ...inflection,
    // Don't turn 'AppDns' into 'AppDn'
    _singularizedTableName(table: any) {
      const tableName = this._tableName(table)
      return tableName.match(/dns$/i) ? tableName : inflection._singularizedTableName(table)
    },
    // Pluralize AppDns correctly
    pluralize(string: any) {
      return string.match(/dns$/i) ? `${string}es` : inflection.pluralize(string)
    },
    // This removes the 'ByFooIdAndBarId' from the end of relations.
    //
    // If this causes a conflict, use smart comments:
    //
    //   https://www.graphile.org/postgraphile/smart-comments/#renaming
    //
    // to rename the relation.
    singleRelationByKeys(detailedKeys: any, table: any, _foreignTable: any, constraint: any) {
      return constraint.tags.fieldName || this.camelCase(`${this._singularizedTableName(table)}`)
    },
    manyRelationByKeys(detailedKeys: any, table: any, _foreignTable: any, constraint: any) {
      return constraint.tags.foreignFieldName || this.camelCase(`${this.pluralize(this._singularizedTableName(table))}`)
    },
    manyRelationByKeysSimple(detailedKeys: any, table: any, _foreignTable: any, constraint: any) {
      return constraint.tags.foreignFieldName || this.camelCase(`${this.pluralize(this._singularizedTableName(table))}`)
    }
  }))
}

StoryscriptPlugin.displayName = 'StoryscriptPlugin'

export default StoryscriptPlugin
