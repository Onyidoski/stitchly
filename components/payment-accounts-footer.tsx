type TenantPayment = {
  bank_name?: string | null
  account_name?: string | null
  account_number?: string | null
  bank_name_2?: string | null
  account_name_2?: string | null
  account_number_2?: string | null
  business_name?: string | null
}

function hasAccount2(tenant: TenantPayment | null | undefined): boolean {
  return Boolean(
    tenant?.account_number_2?.trim() ||
      tenant?.bank_name_2?.trim() ||
      tenant?.account_name_2?.trim()
  )
}

export function PaymentAccountsFooter({
  tenant,
  title = 'Payment Details',
}: {
  tenant: TenantPayment | null | undefined
  title?: string
}) {
  const account1Name = tenant?.account_name || tenant?.business_name || 'Not set'
  const showSecond = hasAccount2(tenant)

  return (
    <div>
      <h4 className="font-bold text-xs uppercase text-muted-foreground mb-2">{title}</h4>
      <div className="space-y-3">
        <div>
          {showSecond && (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Account 1
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Bank Name:{' '}
            <span className="font-medium text-foreground">{tenant?.bank_name || 'Not set'}</span>
            <br />
            Account Name: <span className="font-medium text-foreground">{account1Name}</span>
            <br />
            Account No:{' '}
            <span className="font-medium text-foreground">
              {tenant?.account_number || 'Not set'}
            </span>
          </p>
        </div>

        {showSecond && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Account 2
            </p>
            <p className="text-sm text-muted-foreground">
              Bank Name:{' '}
              <span className="font-medium text-foreground">
                {tenant?.bank_name_2 || 'Not set'}
              </span>
              <br />
              Account Name:{' '}
              <span className="font-medium text-foreground">
                {tenant?.account_name_2 || tenant?.business_name || 'Not set'}
              </span>
              <br />
              Account No:{' '}
              <span className="font-medium text-foreground">
                {tenant?.account_number_2 || 'Not set'}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
