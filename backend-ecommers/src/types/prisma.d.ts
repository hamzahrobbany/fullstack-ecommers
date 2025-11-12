declare module '@prisma/client' {
  class PrismaClient {
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    [model: string]: any;
  }

  export { PrismaClient };
}
