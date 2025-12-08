declare module '@mailchimp/mailchimp_marketing' {
  interface Config {
    apiKey: string;
    server: string;
  }

  interface MergeFields {
    FNAME?: string;
    LNAME?: string;
    [key: string]: any;
  }

  interface AddListMemberBody {
    email_address: string;
    status: 'subscribed' | 'unsubscribed' | 'cleaned' | 'pending';
    merge_fields?: MergeFields;
  }

  interface PingResponse {
    health_status?: string;
  }

  interface Lists {
    addListMember(listId: string, body: AddListMemberBody): Promise<any>;
  }

  interface Ping {
    get(): Promise<PingResponse>;
  }

  interface Mailchimp {
    setConfig(config: Config): void;
    lists: Lists;
    ping: Ping;
  }

  const mailchimp: Mailchimp;
  export default mailchimp;
}
