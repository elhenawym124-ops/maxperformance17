QUERY PLAN                                                                                                  
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 Limit  (cost=79108.76..87505.94 rows=916 width=33) (actual time=602.319..620.462 rows=1858 loops=1)
   Buffers: shared hit=44712
   ->  Nested Loop  (cost=79108.76..87505.94 rows=916 width=33) (actual time=602.318..620.262 rows=1858 loops=1)
         Buffers: shared hit=44712
         ->  Limit  (cost=79108.34..79120.84 rows=5000 width=33) (actual time=602.260..602.714 rows=1858 loops=1)
               Buffers: shared hit=37280
               ->  Sort  (cost=79108.34..79126.46 rows=7249 width=33) (actual time=602.259..602.548 rows=1858 loops=1)
                     Sort Key: (max(m."createdAt")) DESC
                     Sort Method: quicksort  Memory: 179kB
                     Buffers: shared hit=37280
                     ->  GroupAggregate  (cost=78516.69..78643.55 rows=7249 width=33) (actual time=600.868..601.695 rows=1858 loops=1)
                           Group Key: m."conversationId"
                           Buffers: shared hit=37277
                           ->  Sort  (cost=78516.69..78534.82 rows=7249 width=33) (actual time=600.857..600.992 rows=2273 loops=1)
                                 Sort Key: m."conversationId"
                                 Sort Method: quicksort  Memory: 239kB
                                 Buffers: shared hit=37277
                                 ->  Hash Join  (cost=35615.64..78051.90 rows=7249 width=33) (actual time=399.403..597.123 rows=2273 loops=1)
                                       Hash Cond: (m."conversationId" = c2.id)
                                       Buffers: shared hit=37274
                                       ->  Bitmap Heap Scan on messages m  (cost=26071.73..68404.11 rows=39575 width=33) (actual time=349.785..544.871 rows=7797 loops=1)
                                             Recheck Cond: ((content ~~* '%المقاسات%'::text) AND ("createdAt" >= (now() - '180 days'::interval)))
                                             Rows Removed by Index Recheck: 12728
                                             Heap Blocks: exact=18077
                                             Buffers: shared hit=28036
                                             ->  BitmapAnd  (cost=26071.73..26071.73 rows=39575 width=0) (actual time=346.580..346.581 rows=0 loops=1)
                                                   Buffers: shared hit=9930
                                                   ->  Bitmap Index Scan on idx_messages_content_trgm  (cost=0.00..1161.63 rows=100696 width=0) (actual time=28.908..28.909 rows=39285 loops=1)
                                                         Index Cond: (content ~~* '%المقاسات%'::text)
                                                         Buffers: shared hit=837
                                                   ->  Bitmap Index Scan on "messages_createdAt_idx"  (cost=0.00..24890.06 rows=1945523 width=0) (actual time=313.861..313.862 rows=2074552 loops=1)
                                                         Index Cond: ("createdAt" >= (now() - '180 days'::interval))
                                                         Buffers: shared hit=9093
                                       ->  Hash  (cost=9120.30..9120.30 rows=33889 width=25) (actual time=47.743..47.743 rows=28761 loops=1)
                                             Buckets: 65536  Batches: 1  Memory Usage: 2142kB
                                             Buffers: shared hit=9238
                                             ->  Index Scan using "conversations_companyId_idx" on conversations c2  (cost=0.42..9120.30 rows=33889 width=25) (actual time=0.070..39.462 rows=28761 loops=1)
                                                   Index Cond: ("companyId" = 'cmleybpf70028juo2wwpmp8rt'::text)
                                                   Filter: (channel = 'FACEBOOK'::text)
                                                   Rows Removed by Filter: 9057
                                                   Buffers: shared hit=9238
         ->  Index Scan using conversations_pkey on conversations c  (cost=0.42..1.67 rows=1 width=25) (actual time=0.009..0.009 rows=1 loops=1858)
               Index Cond: (id = m."conversationId")
               Filter: (("companyId" = 'cmleybpf70028juo2wwpmp8rt'::text) AND (channel = 'FACEBOOK'::text))
               Buffers: shared hit=7432
 Planning:
   Buffers: shared hit=534
 Planning Time: 5.275 ms
 Execution Time: 621.380 ms
(49 rows)
