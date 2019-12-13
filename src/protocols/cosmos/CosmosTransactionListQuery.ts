export class TransactionListQuery {
  constructor(private readonly offset: number, private readonly limit: number, private readonly address: string) {}

  public toRLPBody(): string {
    return JSON.stringify({
      from: this.offset,
      size: this.limit,
      query: {
        bool: {
          should: [
            {
              multi_match: {
                query: this.address,
                fields: ['tx.value.msg.value.from_address', 'tx.value.msg.value.to_address']
              }
            }
          ]
        }
      },
      sort: [
        {
          height: {
            order: 'desc'
          }
        }
      ]
    })
  }
}